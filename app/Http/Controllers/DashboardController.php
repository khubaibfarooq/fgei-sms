<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Institute;
use App\Models\DashboardCard;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Block;
use App\Models\Shift;
use App\Models\Upgradation;
use App\Models\Room;;
use App\Models\Plant;
use App\Models\Transport;
use App\Models\InstituteAsset;
class DashboardController extends Controller
{
    public function getInstitutes()
    { $regionId = session('region_id');
$role_type=session('type');
if($role_type=="Regional Office")
        $count =  DB::table('institutes')->where('region_id',$regionId)->count();
else{
     $count =  DB::table('institutes')->whereIn('type', ['School', 'College'])->count();
}
        return response()->json(['count' => $count]);
    }
     public function getUsers()
    { 
        $count =  DB::table('users')->count();

        return response()->json(['count' => $count]);
    }
    public function getRequests(Request $request)
    { //Pending,Waiting,Resolved,Rejected
        $count =  DB::table('help_desks')->count();

        return response()->json(['count' => $count]);
    }
    public function getRegions(Request $request)
    { //Pending,Waiting,Resolved,Rejected
        $count =  DB::table('institutes')->where('type','Regional Office')->count();

        return response()->json(['count' => $count]);
    }
   public function getFunds(Request $request)
    {
        $regionId = session('region_id');
        $role_type = session('type');
        $sms_inst_id = session('sms_inst_id');

        $query = DB::table('fund_helds');

        if ($role_type === 'Regional Office') {
            $sum = $query->join("institutes","institutes.id","=","fund_helds.institute_id")->where('institutes.region_id', $regionId)->sum('balance'); 
        } elseif ($role_type === 'School' || $role_type === 'College') {
            $sum = $query->where('institute_id', $sms_inst_id)->sum('balance'); // Adjusted column name
        } else {
            $sum = $query->sum('balance'); // Total sum for other roles
        }

        return response()->json(['count' => $sum]); // Keep 'count' key for frontend compatibility
    }
     public function getProfilePercentage()
{
    $sms_inst_id = session('sms_inst_id');
    $percentage = 0;
     $shift=Shift::where('institute_id', $sms_inst_id)->select('building_type_id')->get();

     if($shift){
      if($shift[0]['building_type_id']==1){
  $criteria = [
        'institute' => [
            'weight' => 20, 
            'check' => fn() => DB::table('institutes')->where('id', $sms_inst_id)->exists(),
            'instruction' => 'Complete Institute Profile'
        ],
        'funds' => [
            'weight' => 20, 
            'check' => fn() => DB::table('fund_helds')->where('institute_id', $sms_inst_id)->exists(),
            'instruction' => 'Add Funds Information'
        ],
        'blocks' => [
            'weight' => 10, 
            'check' => fn() => Block::where('institute_id', $sms_inst_id)->exists(),
            'instruction' => 'Add Blocks Information'
        ],
        'rooms' => [
            'weight' => 10, 
            'check' => fn() => $this->hasRoomsInBlocks($sms_inst_id),
            'instruction' => 'Add Rooms to Blocks'
        ],
        'shifts' => [
            'weight' => 10, 
            'check' => fn() => Shift::where('institute_id', $sms_inst_id)->exists(),
            'instruction' => 'Add Shifts Information'
        ],
        // 'upgradations' => [
        //     'weight' => 10, 
        //     'check' => fn() => Upgradation::where('institute_id', $sms_inst_id)->exists(),
        //     'instruction' => 'Add Upgradation Information'
        // ],
        'plants' => [
            'weight' => 10, 
            'check' => fn() => Plant::where('institute_id', $sms_inst_id)->exists(),
            'instruction' => 'Add Plants Information'
        ],
        // 'transports' => [
        //     'weight' => 10, 
        //     'check' => fn() => Transport::where('institute_id', $sms_inst_id)->exists(),
        //     'instruction' => 'Add Transport Information'
        // ],
        'assets' => [
            'weight' => 20, 
            'check' => fn() => InstituteAsset::where('institute_id', $sms_inst_id)->count() > 10,
            'instruction' => 'Add at least 10 Assets'
        ],
    ];
      }else{
         $criteria = [
        'institute' => [
            'weight' => 40, 
            'check' => fn() => DB::table('institutes')->where('id', $sms_inst_id)->exists(),
            'instruction' => 'Complete Institute Profile'
        ],
        'funds' => [
            'weight' => 40, 
            'check' => fn() => DB::table('fund_helds')->where('institute_id', $sms_inst_id)->exists(),
            'instruction' => 'Add Funds Information'
        ],
    
        'shifts' => [
            'weight' => 20, 
            'check' => fn() => Shift::where('institute_id', $sms_inst_id)->exists(),
            'instruction' => 'Add Shifts Information'
        ],
    
    ];
      }
     }
    // Define completion criteria with their percentage weights
   
    
    $instructions = [];
    
    // Calculate percentage based on completed criteria
    foreach ($criteria as $key => $criterion) {
        if ($criterion['check']()) {
            $percentage += $criterion['weight'];
        } else {
            $instructions[] = $criterion['instruction'];
        }
    }
    
    return response()->json([
        'count' => $percentage.'%',
        'instructions' => $instructions
    ]);
}

/**
 * Check if institute has any rooms in its blocks
 */
private function hasRoomsInBlocks($instituteId)
{
    $blockIds = Block::where('institute_id', $instituteId)->pluck('id');
    
    if ($blockIds->isEmpty()) {
        return false;
    }
    
    return Room::whereIn('block_id', $blockIds)->exists();
}
 public function getRooms(Request $request)
{
    $sms_inst_id = session('sms_inst_id');
    $roomtype = $request->query('id');  // Get array of IDs
    $role_type = session('type');
    $regionId = session('region_id');
if (is_null($roomtype)) {
        $roomtypeArray = [];
    } elseif (is_array($request->query('id'))) {
        $roomtypeArray = array_map('intval', $request->query('id'));
    } else {
        $roomtypeArray = [intval($roomtype)]; // fallback for single value
    }
    $query = DB::table('blocks')
        ->join('rooms', 'blocks.id', '=', 'rooms.block_id');
    if ($role_type === 'Regional Office') {
      
             $query ->join('institutes', 'blocks.institute_id', '=', 'institutes.id')
            ->where('institutes.region_id', $regionId);
            
    } elseif ($role_type === 'School' || $role_type === 'College') {
     $query ->where('blocks.institute_id', $sms_inst_id);
           
    } 
    if (!empty($roomtypeArray)) {
        $query->whereIn('rooms.room_type_id', $roomtypeArray);
    }
$count = $query->count();
    return response()->json(['count' => $count]);
}

 public function getProjects(Request $request)
{
    $sms_inst_id = session('sms_inst_id');
    $status = $request->query('s');  // Get array of IDs
    $role_type = session('type');
    $regionId = session('region_id');

    $query = DB::table('projects');
    if ($role_type === 'Regional Office') {
      
             $query ->join('institutes', 'projects.institute_id', '=', 'institutes.id')
            ->where('institutes.region_id', $regionId);
            
    } elseif ($role_type === 'School' || $role_type === 'College') {
     $query ->where('projects.institute_id', $sms_inst_id);
           
    } 
    if (!empty($status)) {
        $query->where('projects.status', $status);
    }
$count = $query->count();
    return response()->json(['count' => $count]);
}

 public function getBlocks(Request $request)
    {
     
        $sms_inst_id = session('sms_inst_id');

        $count = DB::table('blocks')->where('institute_id',$sms_inst_id)->count();;

return response()->json(['count' => $count]); // Keep 'count' key for frontend compatibility
}
 public function getPlants(Request $request)
    {
     
        $sms_inst_id = session('sms_inst_id');

       $count = DB::table('plants')
    ->where('institute_id', $sms_inst_id)
    ->sum('qty');

return response()->json(['count' => $count]); // Keep 'count' key for frontend compatibility
}
 public function getTransports(Request $request)
    {
     
        $sms_inst_id = session('sms_inst_id');

        $count = DB::table('transports')->where('institute_id',$sms_inst_id)->count();;

return response()->json(['count' => $count]); // Keep 'count' key for frontend compatibility
}


    public function getInstituteCompletionDetails()
    {
        $instituteId = session('sms_inst_id');
        if (!$instituteId) {
            return response()->json(['error' => 'Institute ID is required'], 400);
        }

        $institute = Institute::with([
            'shifts',
            'fundHelds',
            'blocks.rooms',
            'instituteAssets',
            'institutePlants',
            'instituteTransports',
            'projects',
            'upgradations'
        ])->find($instituteId);

        if (!$institute) {
            return response()->json(['error' => 'Institute not found'], 404);
        }

        $shiftsCount = $institute->shifts->count();
        $blocksCount = $institute->blocks->count();
        $roomsCount = $institute->blocks->sum(fn($b) => $b->rooms->count());
        $assetsCount = $institute->instituteAssets->count();
        $plantsCount = $institute->institutePlants->count();
        $transportsCount = $institute->instituteTransports->count();
        $fundsCount = $institute->fundHelds->count();
        $projectsCount = $institute->projects->count();
        $upgradationsCount = $institute->upgradations->count();

        $percentage = 0;
        $firstShift = $institute->shifts->first();
        $buildingTypeId = $firstShift ? $firstShift->building_type_id : null;
        
        $criteria = [];

        if ($buildingTypeId != null) {
            if ($buildingTypeId == 1) { // Owned
                
                // Institute Profile
                $criteria[] = [
                    'name' => 'Complete Institute Profile',
                    'weight' => 20,
                    'completed' => true, 
                    'message' => 'Profile Completed'
                ];
                $percentage += 20;

                // Funds
                $fundsCompleted = $fundsCount > 0;
                $criteria[] = [
                    'name' => 'Add Funds Information',
                    'weight' => 20,
                    'completed' => $fundsCompleted,
                    'message' => $fundsCompleted ? 'Funds Added' : 'No Funds Information'
                ];
                if ($fundsCompleted) $percentage += 20;

                // Blocks
                $blocksCompleted = $blocksCount > 0;
                $criteria[] = [
                    'name' => 'Add Blocks Information',
                    'weight' => 10,
                    'completed' => $blocksCompleted,
                    'message' => $blocksCompleted ? 'Blocks Added' : 'No Blocks Information'
                ];
                if ($blocksCompleted) $percentage += 10;

                // Rooms
                $roomsCompleted = $roomsCount > 0;
                $criteria[] = [
                    'name' => 'Add Rooms to Blocks',
                    'weight' => 10,
                    'completed' => $roomsCompleted,
                    'message' => $roomsCompleted ? 'Rooms Added' : 'No Rooms Information'
                ];
                if ($roomsCompleted) $percentage += 10;

                // Shifts
                $shiftsCompleted = $shiftsCount > 0;
                $criteria[] = [
                    'name' => 'Add Shifts Information',
                    'weight' => 10,
                    'completed' => $shiftsCompleted,
                    'message' => $shiftsCompleted ? 'Shifts Added' : 'No Shifts Information'
                ];
                if ($shiftsCompleted) $percentage += 10;

                // Plants
                $plantsCompleted = $plantsCount > 0;
                $criteria[] = [
                    'name' => 'Add Plants Information',
                    'weight' => 10,
                    'completed' => $plantsCompleted,
                    'message' => $plantsCompleted ? 'Plants Added' : 'No Plants Information'
                ];
                if ($plantsCompleted) $percentage += 10;

                // Assets
                $assetsCompleted = $assetsCount > 10;
                $criteria[] = [
                    'name' => 'Add at least 10 Assets',
                    'weight' => 20,
                    'completed' => $assetsCompleted,
                    'message' => $assetsCompleted ? 'Assets Added (>10)' : 'Assets Count: ' . $assetsCount
                ];
                if ($assetsCompleted) $percentage += 20;

            } else { // Rented / Other
                
                // Institute Profile
                $criteria[] = [
                    'name' => 'Complete Institute Profile',
                    'weight' => 40,
                    'completed' => true,
                    'message' => 'Profile Completed'
                ];
                $percentage += 40;

                // Funds
                $fundsCompleted = $fundsCount > 0;
                $criteria[] = [
                    'name' => 'Add Funds Information',
                    'weight' => 40,
                    'completed' => $fundsCompleted,
                    'message' => $fundsCompleted ? 'Funds Added' : 'No Funds Information'
                ];
                if ($fundsCompleted) $percentage += 40;

                // Shifts
                $shiftsCompleted = $shiftsCount > 0;
                $criteria[] = [
                    'name' => 'Add Shifts Information',
                    'weight' => 20,
                    'completed' => $shiftsCompleted,
                    'message' => $shiftsCompleted ? 'Shifts Added' : 'No Shifts Information'
                ];
                if ($shiftsCompleted) $percentage += 20;
            }
        } else {
             // Fallback if no shift/building type defined - assume default generic checks or fail everything?
             // Since buildingTypeId is null, original logic implies percentage 0.
             // We can check if they populated anything at all?
             // But following original logic: if buildingTypeId is null, they get nothing calculated in the main loop.
             // We should prompt them to add shifts first.
             $criteria[] = [
                 'name' => 'Add Shifts Information (Required)',
                 'weight' => 100,
                 'completed' => false,
                 'message' => 'Please add shifts to determine building type'
             ];
        }

        $percentage = min($percentage, 100);

        return response()->json([
            'institute' => $institute->name,
            'percentage' => $percentage,
            'criteria' => $criteria
        ]);
    }
public function index(Request $request)
{
   
    $role_type = session('type');
    $hrInstituteId = session('inst_id');
    $regionId = session('region_id');
      $sms_inst_id = session('sms_inst_id');
    

// dd(session());
$tab1 = [];
$tab2 = [];
$tab3 = [];
$link1="";
$link2="";
$link3="";

$title1 = "";
$title2 = "";
$title3 = "";

if ($role_type === 'School' || $role_type === 'College') {
    $title1 = "Funds";
$title2 = "Projects";
$title3 = "Assets";
   $link1="/fund-trans/";
$link2="/projects?status=";
$link3="/institute-assets?category=";
    $tab1 = DB::table('fund_helds')->where('institute_id', $sms_inst_id)
    ->select( 'fund_heads.id  as Key','fund_heads.name as Head','fund_helds.balance',)
            ->join('fund_heads', 'fund_heads.id', '=', 'fund_helds.fund_head_id')
            ->get();
    
     $tab2 = DB::table('projects')
    ->where('institute_id', $sms_inst_id)
    ->select('status as Key','status')
    ->selectRaw('COUNT(*) as project_count')
    ->selectRaw('SUM(estimated_cost) as total_cost')
            ->selectRaw('SUM(projects.actual_cost) as total_actual')


    ->groupBy('status')
    ->get();

 $tab3 = DB::table('institute_assets')
    ->where('institute_id', $sms_inst_id)
    ->select( 'asset_categories.id as Key', 
        'asset_categories.name as Category', 
        DB::raw('sum(institute_assets.current_qty) as total_assets')
    )
    ->join('assets', 'assets.id', '=', 'institute_assets.asset_id')
    ->join('asset_categories', 'asset_categories.id', '=', 'assets.asset_category_id') // Fixed typo here
    ->groupBy('asset_categories.name', 'asset_categories.id')
    ->get();
}else if($role_type=='Regional Office'){
    $title1 = "Institutes";
$title2 = "Funds";
$title3 = "Projects";
 $link2="/reports/funds?fund_head_id=";
$link3="/reports/projects?status=";
    $tab1 = DB::table('institutes')->where('region_id', $regionId)->where('type','<>','Regional Office')->where('type','<>','Directorate')
    ->select('type as Key','type', DB::raw('COUNT(*) as institute_count'))
    ->groupBy('type')
    ->get();
    
     $tab2 = DB::table('fund_helds')->join('institutes', 'fund_helds.institute_id', '=', 'institutes.id')
     ->where('institutes.region_id', $regionId)
    ->select( 'fund_heads.id as Key','fund_heads.name as Head','fund_helds.balance',)
            ->join('fund_heads', 'fund_heads.id', '=', 'fund_helds.fund_head_id')
            ->get();
        $tab3 = DB::table('projects')->join('institutes', 'projects.institute_id', '=', 'institutes.id')
    ->where('institutes.region_id', $regionId)
    ->select('projects.status as Key','projects.status as Status')
    ->selectRaw('COUNT(*) as project_count')
    ->selectRaw('SUM(projects.estimated_cost) as estimated_cost')
        ->selectRaw('SUM(projects.actual_cost) as actual_cost')


    ->groupBy('status')
    ->get();

}else if($role_type=='Admin'){
    $title1 = "Users";
$title2 = "Tasks";

    $tab1 = DB::table('users')
    ->select('type')
     ->selectRaw('COUNT(*) as user_count')
    ->groupBy('type')
    ->get();
    
     $tab2 = DB::table('help_desks')
     
    ->select( 'status', DB::raw('COUNT(*) as total_request'),)
  
    ->groupBy('status')
            ->get();
    

}
else if($role_type=='Directorate' || $role_type=='Director HRM'){
   $link1="/reports/funds?fund_head_id=";
$link2="/reports/projects?status=";
$link3="";
    $title1 = "Total Funds";
  $title2 = "Projects";
  $title3 = "Institutions";
$tab1 = DB::table('fund_helds')
    ->join('fund_heads', 'fund_heads.id', '=', 'fund_helds.fund_head_id')
    ->groupBy('fund_heads.id', 'fund_heads.name') // Must group by actual columns
    ->select([
     'fund_heads.id as Key',
        'fund_heads.name as Head',
        DB::raw('SUM(fund_helds.balance) as balance')
    ])
    ->get();

     $tab2 = DB::table('projects')
      
    ->select('projects.status as Key',DB::raw('CONCAT(UPPER(LEFT(projects.status, 1)), LOWER(SUBSTRING(projects.status, 2))) as status'))
    ->selectRaw('COUNT(*) as project_count')
    ->selectRaw('SUM(projects.estimated_cost) as estimated_cost')
            ->selectRaw('SUM(projects.actual_cost) as actual_cost')


    ->groupBy('status')
    ->get();
   
    $tab3 = DB::table('institutes')->where('type','<>','Directorate')
    ->select('type as Key','type', DB::raw('COUNT(*) as institute_count'))
    ->groupBy('type')
    ->orderBy('institute_count','desc')
    ->get();

}

    $user = Auth::user();
    $roleIds = $user?->roles()->pluck('id');

    // Fallback: if you also store a role name on users.role, try mapping it to a Role id
    if (($roleIds?->count() ?? 0) === 0 && !empty($user?->role)) {
        $fallbackRoleId = \Spatie\Permission\Models\Role::where('name', $user->role)->value('id');
        $roleIds = collect(array_filter([$fallbackRoleId]));
    }

$cards = DashboardCard::visibleTo(auth()->user())
    ->ordered()
    ->get();

        
    
        return Inertia::render('dashboard', [
           
            'cards' => $cards,
            'tab1' => $tab1,
            'tab2' => $tab2,
            'tab3' => $tab3,
            'title1' => $title1,
            'title2' => $title2,
            'title3' => $title3,
             'link1' => $link1,
            'link2' => $link2,
            'link3' => $link3,
        ]);
    }


}
