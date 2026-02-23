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
use App\Models\InstituteAsset;
use App\Models\AssetCategory;
use App\Models\Asset;
use App\Models\Room;
use App\Models\VehicleType;
use App\Models\Transport;
use App\Models\Plant;
use App\Models\Project;
use App\Models\ProjectType;
use App\Models\FundHeld;
use App\Models\Fund;
use App\Models\FundHead;
use App\Models\Upgradation;
use App\Models\Block;
use App\Models\Shift;
use Illuminate\Support\Facades\DB;

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
                return redirect('https://hrms.fgei.gov.pk/login')->with('error', 'No authentication token provided.');
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
                return redirect('https://hrms.fgei.gov.pk/login')->with('error', 'Invalid token: missing user information.');
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
                    // Assign role based on Category
                $smsRole = $this->getSmsRoleFromCategory($data['Category'] ?? 'user');
                $user->assignRole($smsRole);
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
                return redirect('https://hrms.fgei.gov.pk/login')->with('error', 'Authentication failed.');
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
            return redirect('   https://hrms.fgei.gov.pk/login')->with('error', 'Token has expired. Please login again from HR system.');
        } catch (SignatureInvalidException $e) {
            \Log::warning('SSO: Invalid token signature');
            return redirect('https://hrms.fgei.gov.pk/login')->with('error', 'Invalid token signature.');
        } catch (Exception $e) {
            \Log::error('SSO Error: ' . $e->getMessage());
            return redirect('https://hrms.fgei.gov.pk/login')->with('error', 'Invalid or tampered token from HR.');
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
            'email' => $data['cnic'] ?? null,
            'inst_id' => $data['institution_id'] ?? null,
            'region_id' => $data['region_id'] ?? null,
            'type' => $data['Category'] ?? 'user',
            'password' => $data['Password'] ?? Hash::make('admin123'), // Random password for SSO users

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
                   case 'director hrm':
                return 'DirHRM';
            case 'regional office':
            case 'region':
                return 'Region';
            case 'admin':
                return 'admin';
         case 'sms_tech_approval':
                return 'sms_tech_approval';
            default:
                return 'user';
        }
    }
public function SendInstituteData(Request $request)
{
    $token = $request->header('token');

    try {
        if (empty($token) || $token !== env('JWT_SECRET_KEY')) {
            \Log::warning('SSO: Invalid or missing API token');
            return response()->json(['error' => 'Unauthorized: Invalid token'], 401);
        }

        $institute_id_param = $request->query('institute_id');
        $type = $request->query('type');

        if (!$institute_id_param || !is_numeric($institute_id_param) || $institute_id_param <= 0) {
            return response()->json(['error' => 'Invalid or missing institute_id'], 422);
        }

        if (empty($type)) {
            return response()->json(['error' => 'Missing required query parameter: type'], 422);
        }

        $allowedTypes = ['institute', 'institute_profile', 'blocks', 'rooms', 'shifts', 'assets', 'funds', 'transports', 'projects', 'upgradations'];
        $types = array_intersect(explode(',', $type), $allowedTypes);

        if (empty($types)) {
            return response()->json(['error' => 'Invalid type value(s). Allowed: ' . implode(', ', $allowedTypes)], 422);
        }

        $institute = Institute::select('id', 'hr_id', 'established_date', 'total_area', 'convered_area', 'img_3d')
            ->where('hr_id', $institute_id_param)
            ->first();

        if (!$institute) {
            return response()->json(['error' => 'Institute not found'], 404);
        }

        $institute_id = $institute->id;
        $response = [];

        foreach ($types as $t) {
            switch ($t) {
                case 'institute':
                    $response['institute'] = $institute;
                    break;

                case 'institute_profile':
                    $institute->img_3d = $institute->img_3d ? url('assets/' . $institute->img_3d) : null;
                    $response['institute_profile'] = $institute->img_3d;
                    break;

                case 'blocks':
                    $response['blocks'] = Block::where('institute_id', $institute_id)->count();
                    break;

                case 'rooms':
                    $blockIds = Block::where('institute_id', $institute_id)->pluck('id')->toArray();
                    $response['rooms'] = Room::whereIn('block_id', $blockIds)->groupBy('room_type_id')->with('roomType')->get();
                    break;

                case 'shifts':
                    $response['shifts'] = Shift::where('institute_id', $institute_id)->with('buildingType')->get();
                    break;

                case 'assets':
                    $response['assets'] = InstituteAsset::query()
                        ->where('institute_id', $institute_id)
                        ->join('assets', 'institute_assets.asset_id', '=', 'assets.id')
                        ->select([
                            'assets.id',
                            'assets.name',
                            DB::raw('SUM(institute_assets.current_qty) as total_qty'),
                            DB::raw('COUNT(DISTINCT institute_assets.room_id) as locations_count')
                        ])
                        ->groupBy('assets.id', 'assets.name')
                        ->orderBy('assets.name')
                        ->get();
                    break;

                case 'funds':
                    $response['funds'] = FundHeld::where('institute_id', $institute_id)->with('fundHead')->get();
                    break;

                case 'transports':
                    $response['transports'] = Transport::where('institute_id', $institute_id)->with('vehicleType')->get();
                    break;

                case 'upgradations':
                    $response['upgradations'] = Upgradation::where('institute_id', $institute_id)->get();
                    break;

                case 'projects':
                    $response['projects'] = ProjectType::whereHas('projects', fn($q) => $q->where('institute_id', $institute_id))
                        ->withCount([
                            'projects as completed' => fn($q) => $q->where('institute_id', $institute_id)->where('status', 'completed'),
                            'projects as inprogress' => fn($q) => $q->where('institute_id', $institute_id)->where('status', 'inprogress'),
                            'projects as planned'    => fn($q) => $q->where('institute_id', $institute_id)->where('status', 'planned'),
                        ])
                        ->get();
                    break;
            }
        }

        return response()->json($response);

    } catch (\Exception $e) {
        \Log::error('Error fetching institute data: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to fetch institute data', 'message' => $e->getMessage()], 500);
    }
}
//      public function SendInstituteData(Request $request)
// {
//         // Read token from request header
//         $token = $request->header('token');

//         \Log::info('SSO Institute Data Request', ['token_present' => !empty($token)]);

//         try {
//             // Validate the static API token
//             $expectedToken = env('JWT_SECRET_KEY');
//             if (empty($token) || $token !== $expectedToken) {
//                 \Log::warning('SSO: Invalid or missing API token');
//                 return response()->json(['error' => 'Unauthorized: Invalid token'], 401);
//             }

//             $institute_id_param = $request->query('institute_id');

//     $instituteAssets = [];
//     $blocks = [];
//     $rooms = [];
//     $shifts = [];
//     $upgradations = [];
//     $funds = [];
//     $projects = [];
//     $transports = [];
//     $institute = [];

//     if ($institute_id_param && is_numeric($institute_id_param) && $institute_id_param > 0) {
//         $institute = Institute::select('id','hr_id','established_date','total_area','convered_area','img_3d')->where('hr_id', $institute_id_param)->first();
//         $institute->img_3d = $institute->img_3d ? url('assets/' . $institute->img_3d) : null;
//         $institute_id = $institute->id;
//         $shifts=Shift::where('institute_id', $institute_id)->with('buildingType')->get();
//       $upgradations=Upgradation::where('institute_id', $institute_id)->get();
//     $funds=FundHeld::where('institute_id', $institute_id)->with('fundHead')->get();
//         $transports=Transport::where('institute_id', $institute_id)->with('vehicleType')->get();
//         $blocks = Block::where('institute_id', $institute_id)->get();
//         $blockIds = $blocks->pluck('id')->toArray();
//         $rooms = Room::whereIn('block_id', $blockIds)->with('block')->get();
   
       
//               $instituteAssets = InstituteAsset::query()
//         ->where('institute_id', $institute_id)
//         ->join('assets', 'institute_assets.asset_id', '=', 'assets.id')
//         ->select([
//             'assets.id',
//             'assets.name',
//             DB::raw('SUM(institute_assets.current_qty) as total_qty'),
//             DB::raw('COUNT(DISTINCT institute_assets.room_id) as locations_count')
//         ])
//         ->with(['institute', 'room', 'asset'])
//         ->groupBy('assets.id', 'assets.name')
//         ->orderBy('assets.name')
//         ->get();
// $projects = ProjectType::whereHas('projects', function($query) use ($institute_id) {
//         $query->where('institute_id', $institute_id);
//     })
//     ->withCount([
//         'projects as completed' => function($query) use ($institute_id) {
//             $query->where('institute_id', $institute_id)
//                   ->where('status', 'completed');
//         },
//         'projects as inprogress' => function($query) use ($institute_id) {
//             $query->where('institute_id', $institute_id)
//                   ->where('status', 'inprogress');
//         },
//         'projects as planned' => function($query) use ($institute_id) {
//             $query->where('institute_id', $institute_id)
//                   ->where('status', 'planned');
//         }
//     ])
//     ->get();  
// }

//     return response()->json([
// 'institute'=>$institute,
//         'blocks' => $blocks,
//         'rooms' => $rooms,
     
//         'instituteAssets' => $instituteAssets,
//         'shifts'=>$shifts,
//         'upgradations'=>$upgradations,
//         'funds'=>$funds,
//         'projects'=>$projects,
//         'transports'=>$transports,
       
//     ]);
// } catch (\Exception $e) {
//     \Log::error('Error fetching institute data: ' . $e->getMessage());
//     return response()->json([
//         'error' => 'Failed to fetch institute data',
//         'message' => $e->getMessage()
//     ], 500);
// }
// }

    public function OpenInstitutionProfile(Request $request)
    {
        $institution_id = $request->input('institution_id');

        if (!$institution_id) {
            return redirect()->back()->with('error', 'Institution ID is required');
        }

        $key = $this->secretKey; // Use class property initialized in constructor
        
        $payload = [
            'iss' => env('APP_URL'),
            'iat' => time(),
            'exp' => time() + (60 * 60),
            'data' => [
                'institution_id' => $institution_id
            ]
        ];

        $token = JWT::encode($payload, $key, 'HS256');
        $hrms_url = env('HRMS_URL');
        
        return redirect()->away($hrms_url.'/external/institutional-profile/' . $token);
    }
}