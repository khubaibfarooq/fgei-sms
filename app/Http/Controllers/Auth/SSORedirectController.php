<?php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Institute;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;
use Exception;

class SSORedirectController extends Controller
{
    private $secretKey;

    /**
     * Constructor to initialize the secret key
     */
    public function __construct()
    {
        $this->secretKey = env('JWT_SECRET_KEY');

        // Ensure secretKey is available
        if (empty($this->secretKey)) {
            \Log::error('SSO JWT Error: JWT_SECRET_KEY is not set in the environment.');
            throw new Exception('JWT_SECRET_KEY is not configured.');
        }
    }

    public function handle(Request $request)
    {
        $token = $request->query('token');
    
        \Log::info('SSO Redirect initiated', ['token_present' => !empty($token)]);
    
        try {
            if (empty($token)) {
                \Log::warning('SSO: No token provided');
                return redirect('/login')->with('error', 'No authentication token provided.');
            }
    
            // Add leeway for clock skew between servers (60 seconds)
            JWT::$leeway = 60;
            
            // Decode and verify JWT token
            $decoded = JWT::decode($token, new Key($this->secretKey, 'HS256'));
            $data = (array) $decoded->data;
    
            // Extract data...
            $hr_user_id = $data['user_id'] ?? null;
            
            if (!$hr_user_id) {
                \Log::warning('SSO: No user_id in token');
                return redirect('/login')->with('error', 'Invalid token: missing user information.');
            }
    
            $user = User::where('hr_user_id', $hr_user_id)->first();
    
            if ($user) {
                // Update existing user
                $user->update([
                    'name' => $data['name'] ?? $user->name,
                    'inst_id' => $data['institution_id'] ?? $user->inst_id,
                    'region_id' => $data['region_id'] ?? $user->region_id,
                    'type' => $data['Category'] ?? $user->type,
                ]);
                
                \Log::info('SSO: Updated existing user', ['user_id' => $user->id]);
            } else {
                // Create new user
                $user = $this->createNewUser($data);
                \Log::info('SSO: Created new user', ['user_id' => $user->id]);
            }
    
            // Clear any existing session
            Session::flush();
            
            // Login the user
            Auth::guard('web')->login($user);
            
            // Regenerate session ID for security
            $request->session()->regenerate();
            
            // Set session variables
            $this->setSessionVariables($user);
    
            // Verify login worked
            if (!Auth::check()) {
                \Log::error('SSO: Authentication failed after login attempt');
                return redirect('/login')->with('error', 'Authentication failed.');
            }
    
            \Log::info('SSO: Login successful', [
                'user_id' => Auth::id(),
                'session_id' => session()->getId()
            ]);
    
            // CRITICAL: Force session to be saved before redirect
            $request->session()->save();
            
            // Small delay to ensure session is written (especially for file/database drivers)
            usleep(100000); // 100ms delay
    
            return redirect()->intended('/dashboard');
    
        } catch (ExpiredException $e) {
            \Log::warning('SSO: Token expired');
            return redirect('/login')->with('error', 'Token has expired. Please login again from HR system.');
        } catch (SignatureInvalidException $e) {
            \Log::warning('SSO: Invalid token signature');
            return redirect('/login')->with('error', 'Invalid token signature.');
        } catch (Exception $e) {
            \Log::error('SSO Error: ' . $e->getMessage());
            return redirect('/login')->with('error', 'Invalid or tampered token from HR.');
        }
    }

    /**
     * Create a new user from HR data
     */
    private function createNewUser($data)
    {
        return User::create([
            'hr_user_id' => $data['user_id'],
            'name' => $data['name'] ?? 'Unknown',
            'email' => $data['email'] ?? null,
            'inst_id' => $data['institution_id'] ?? null,
            'region_id' => $data['region_id'] ?? null,
            'type' => $data['Category'] ?? 'user',
            'password' => Hash::make(uniqid()), // Random password for SSO users
        ]);
    }

    /**
     * Set session variables for the user
     */
    private function setSessionVariables($user, $institute = null)
    {
        session(['type' => $user->type]);
        session(['inst_id' => $user->inst_id]);
        session(['region_id' => $user->region_id]);

        // Find institute if not provided
        if (!$institute && $user->inst_id) {
            $institute = Institute::where('hr_id', $user->inst_id)->first();
        }
        session(['sms_inst_id' => $institute ? $institute->id : null]);
    }

    /**
     * Map HR category to SMS role
     */
    private function getSmsRoleFromCategory($category)
    {
        switch (strtolower($category)) {
            case 'school':
            case 'college':
                return 'Institute';
            case 'directorate':
                return 'Directorate';
            case 'regional office':
            case 'region':
                return 'Region';
            case 'admin':
                return 'admin';
            default:
                return 'user';
        }
    }
}