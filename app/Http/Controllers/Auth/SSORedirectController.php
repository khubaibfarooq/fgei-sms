<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Institute;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Http;
use Exception;
use Illuminate\Support\Facades\Session;
class SSORedirectController extends Controller
{
    public function handle(Request $request)
    {
        // Validate token presence
        if (!$request->has('token')) {
            return redirect('/login')->with('error', 'Invalid redirect from HR.');
        }

        try {
            
        
            // Decrypt token (assuming HR encrypts it with shared key; adjust for JWT if used)
            $decrypted = Crypt::decryptString($request->token);
            $userToken = json_decode($decrypted, true);

            // Extract data (with defaults)
             
            $data = $userToken['data'] ?? [];
         
           $token = $data['token'] ?? null;

            $hr_user_id = $data['user_id'] ?? null;
            $name = $data['name'] ?? null;
            
            $cnic = $data['cnic'] ?? null;
            $roleFromHr = $data['Role'] ?? null; // Not used for assignment, but available
            $category = $data['Category'] ?? null;
            $password = $data['password'] ?? null; // Plaintext from HR; we'll hash
            $institution_id = $data['institution_id'] ?? null;
            $region_id = $data['region_id'] ?? null;
            //$istokenMatched=GetHrmsToken($token);
            // Required fields check  !$istokenMatched || !$token ||
            if (   !$hr_user_id || !$name || !$cnic || !$category || !$password) {
                return redirect('/login')->with('error', 'Missing required data from HR.');
            }

            // Check if user exists in SMS by hr_user_id
            $user = User::where('hr_user_id', $hr_user_id)->first();

            if ($user) {
                // User exists; log them in (create session)
                Session::flush();
   
                Auth::login($user);

                 session(['type'=> $user->type]);
            session(['inst_id'=> $user->inst_id]);
            session(['region_id'=> $user->region_id]);
              $hrInstituteId = Session::get('inst_id');
            $institute = Institute::where('hr_id', $hrInstituteId)->first();
            session(['sms_inst_id'=> $institute ? $institute->id : null]);
                return redirect('/dashboard'); // Or intended() if post-login redirect needed
            }

            // User not found; create new
            $email = $cnic . '@hr.com'; // Placeholder; adjust if real email available

            $user = User::create([
                'name' => $name,
                'email' => $email,
                'inst_id'=>$institution_id,
                'region_id'=>$region_id,
                'type'=>$category,
                'password' => Hash::make($password), // Hash the provided password
                'hr_user_id' => $hr_user_id,
                // Add other fields if needed, e.g., institution_id, region_id (add columns if required)
            ]);
 $inst = Institute::create([
                'name' => $name,
                'type' => $category,
                'inst_id'=>$institution_id,
                'region_id'=>$region_id,
              
             
               
            ]);
            // Assign role based on Category
            $smsRole = $this->getSmsRoleFromCategory($category);
            if ($smsRole) {
                $user->assignRole($smsRole);
            } else {
                // Fallback role or error
                $user->assignRole('institute'); // Default to 'institute'
            }

     
           
            Auth::login($user);
// Store session values
           
            session(['type', $user->type]);
            session(['inst_id', $user->inst_id]);
            session(['region_id', $user->region_id]);
            

            // Find institute
            // $hrInstituteId = Session::get('inst_id');
            // $institute = Institute::where('hr_id', $hrInstituteId)->first();
            session(['sms_inst_id', $ $inst ? $ $inst->id : null]);
            return redirect('/dashboard');
        } catch (\Exception $e) {
            // Handle decryption errors, invalid JSON, etc.
            return redirect('/login')->with('error', 'Invalid or tampered token from HR.');
        }
    }
    //not yet applied
 public function GetHrmsToken($Hrmstoken)
    {


        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token,
            ])->get($this->baseUrl . '/api/GetSMSHrmsToken', [
                'Hrmstoken' => $Hrmstoken,
            ]);

            if ($response->successful()) {
                return true;
            } else {
                throw new Exception('Failed to Fetch Hrms Token from the API: ' . $response->status());
            }
        } catch (Exception $e) {
            throw new Exception('An error occurred: ' . $e->getMessage());
        }
    }
    private function getSmsRoleFromCategory($category)
    {
        return match (strtolower($category)) {
            'school', 'college' => 'Institute',
            'directorate section' => 'Directorate',
            'regional office' => 'Region',
            default => 'user',
        };
    }


// In HR app controller
public function redirectToSMS(Request $request)
{
    // Example user data from HR session
    $userData = [
        'data' => [
            'user_id' => 101,
            'name' => "test",
            'cnic' => '1311', // Assuming CNIC is stored
            'Role' => "Regional Office", // Spatie role
            'Category' => "Regional Office",
            'password' => "admin123", // Avoid sending password; see notes
            'institution_id' => 101,
            'region_id' => 58,
        ]
    ];

    // Encrypt the data
    $token = Crypt::encryptString(json_encode($userData));

    // Redirect to SMS with token
    return redirect("http://127.0.0.1:8000/sso-redirect?token=" . urlencode($token));
}
}