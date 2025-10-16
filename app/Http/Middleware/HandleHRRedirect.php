<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class HandleHRRedirect
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            // Get encrypted data from query parameter
            $encryptedData = $request->query('data');

            if (!$encryptedData) {
                return redirect()->route('login')->with('error', 'Invalid redirect data.');
            }

            // Decrypt the data
            $decryptedData = json_decode(Crypt::decryptString($encryptedData), true);

            // Validate the data
            if (!isset($decryptedData['user_id']) || !isset($decryptedData['timestamp'])) {
                return redirect()->route('login')->with('error', 'Invalid data provided.');
            }

            // Check timestamp to prevent replay attacks
            if (now()->timestamp - $decryptedData['timestamp'] > 300) { // 5-minute window
                return redirect()->route('login')->with('error', 'Redirect link expired.');
            }

            // Clear existing session data
            Session::flush(); // Remove all existing session data (e.g., login_web_*, sms_inst_id)

            // Regenerate session ID
            $request->session()->regenerate(); // Creates a new session ID
            $request->session()->regenerateToken(); // Regenerates CSRF token for security

            // Set new session values from HR project
            Session::put('user_id', $decryptedData['user_id']);
            Session::put('name', $decryptedData['name']);
            Session::put('role', $decryptedData['role']);
            Session::put('is_from_hr', true); // Flag to indicate HR redirect

            // Add SMS-specific session values (based on your dd output)
            Session::put('sms_inst_id', $decryptedData['sms_inst_id'] ?? null); // Example: Pass sms_inst_id from HR
            Session::put('type', $decryptedData['type'] ?? 'Regional Office'); // Example default
            Session::put('inst_id', $decryptedData['inst_id'] ?? null);
            Session::put('region_id', $decryptedData['region_id'] ?? null);
            Session::put('role_id', $decryptedData['role_id'] ?? null);

            // Optionally log in the user
            $user = \App\Models\User::find($decryptedData['user_id']);
            if ($user) {
                \Illuminate\Support\Facades\Auth::login($user, $decryptedData['remember'] ?? false); // Use remember_token if needed
            } else {
                return redirect()->route('login')->with('error', 'User not found in SMS system.');
            }

            // Proceed to the next request
            return $next($request);
        } catch (\Exception $e) {
            return redirect()->route('login')->with('error', 'An error occurred: ' . $e->getMessage());
        }
    }
}