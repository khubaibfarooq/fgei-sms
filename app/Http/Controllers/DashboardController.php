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
    
    // Define completion criteria with their percentage weights
    $criteria = [
        'institute' => ['weight' => 10, 'check' => fn() => DB::table('institutes')->where('id', $sms_inst_id)->exists()],
        'funds' => ['weight' => 10, 'check' => fn() => DB::table('fund_helds')->where('institute_id', $sms_inst_id)->exists()],
        'blocks' => ['weight' => 10, 'check' => fn() => Block::where('institute_id', $sms_inst_id)->exists()],
        'rooms' => ['weight' => 10, 'check' => fn() => $this->hasRoomsInBlocks($sms_inst_id)],
        'shifts' => ['weight' => 10, 'check' => fn() => Shift::where('institute_id', $sms_inst_id)->exists()],
        'upgradations' => ['weight' => 10, 'check' => fn() => Upgradation::where('institute_id', $sms_inst_id)->exists()],
        'plants' => ['weight' => 10, 'check' => fn() => Plant::where('institute_id', $sms_inst_id)->exists()],
        'transports' => ['weight' => 10, 'check' => fn() => Transport::where('institute_id', $sms_inst_id)->exists()],
        'assets' => ['weight' => 20, 'check' => fn() => InstituteAsset::where('institute_id', $sms_inst_id)->count() > 50],
    ];
    
    // Calculate percentage based on completed criteria
    foreach ($criteria as $criterion) {
        if ($criterion['check']()) {
            $percentage += $criterion['weight'];
        }
    }
    
    return response()->json(['count' => $percentage.'%']);
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
    ->selectRaw('SUM(cost) as total_cost')
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
    ->select('projects.status as Key','projects.status')
    ->selectRaw('COUNT(*) as project_count')
    ->selectRaw('SUM(projects.cost) as total_cost')
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
    ->selectRaw('SUM(projects.cost) as total_cost')
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
