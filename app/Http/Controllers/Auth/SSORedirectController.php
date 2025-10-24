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


    public function handle(Request $request)
    {
        $secretKey = env('JWT_SECRET_KEY');
       
        $token = $request->query('token');

        // Validate token presence
        
  
        try {
            // Decode and verify JWT token
             $decoded=null;
             if (!empty($token)) {
              $decoded = JWT::decode($token, new Key($secretKey, 'HS256'));
        }


        
            // // Verify audience (optional but recommended)
            // if ($decoded->aud !== config('app.url')) {
            //     return redirect('/login')->with('error', 'Token not intended for this system.');
            // }

            // Extract data from JWT payload
            $data = (array) $decoded->data;
            
            $hr_user_id = $data['user_id'] ?? null;
            $name = $data['name'] ?? null;
            $cnic = $data['cnic'] ?? null;
            $roleFromHr = $data['Role'] ?? null;
            $category = $data['Category'] ?? null;
            $hashedPassword = $data['password'] ?? null; // Already hashed from HR
            $institution_id = $data['institution_id'] ?? null;
            $region_id = $data['region_id'] ?? null;

            // // Required fields check
            // if (!$hr_user_id || !$name || !$cnic || !$category || !$hashedPassword) {
            //     \Log::error('SSO JWT Error: Invalid signature for token: ' . $token);
            //     return redirect('/login')->with('error', 'Missing required data from HR.');
            // }

            // Check if user exists in SMS by hr_user_id
            $user = User::where('hr_user_id', $hr_user_id)->first();

            if ($user) {
                // User exists; update their information
                $user->update([
                    'name' => $name,
                    'inst_id' => $institution_id,
                    'region_id' => $region_id,
                    'type' => $category,
                  
                ]);

                // Clear existing session and log in
                Session::flush();
                Auth::login($user);

                // Set session variables
                $this->setSessionVariables($user);

                return redirect('/dashboard');
            }

            // User not found; create new
            $email = $cnic . '@hr.com'; // Placeholder email

            $user = User::create([
                'name' => $name,
                'email' => $email,
                'inst_id' => $institution_id,
                'region_id' => $region_id,
                'type' => $category,
                'password' => $hashedPassword, // Use hashed password from HR
                'hr_user_id' => $hr_user_id,
            ]);

            // Create or find institute
            $institute = null;
            if (!empty($institution_id)) {
                $institute = Institute::firstOrCreate(
                    ['hr_id' => $institution_id],
                    [
                        'name' => $name,
                        'type' => $category,
                        'region_id' => $region_id,
                    ]
                );
            }

            // Assign role based on Category
            $smsRole = $this->getSmsRoleFromCategory($category);
            if ($smsRole) {
                $user->assignRole($smsRole);
            } else {
                $user->assignRole('user'); // Default role
            }

            // Log in the new user
            Auth::login($user);

            // Set session variables
            $this->setSessionVariables($user, $institute);

            return redirect('/dashboard');

        } catch (ExpiredException $e) {
            return redirect('/login')->with('error', 'Token has expired. Please login again from HR system.');
        } catch (SignatureInvalidException $e) {
            return redirect('/login')->with('error', 'Invalid token signature.');
        } catch (Exception $e) {
            // Log the error for debugging
            \Log::error('SSO JWT Error: ' . $e->getMessage());
            return redirect('/login')->with('error', 'Invalid or tampered token from HR.');
        }
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
        return match (strtolower($category)) {
            'school', 'college' => 'Institute',
            'directorate' => 'Directorate',
            'regional office', 'region' => 'Region',
            'admin' => 'admin',
            default => 'user',
        };
    }
}