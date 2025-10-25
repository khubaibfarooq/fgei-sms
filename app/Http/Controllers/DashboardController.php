<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Institute;
use App\Models\DashboardCard;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
class DashboardController extends Controller
{
    public function getInstitutes()
    { $regionId = session('region_id');
$role_type=session('type');
if($role_type=="Regional Office")
        $count =  DB::table('institutes')->where('region_id',$regionId)->count();
else{
     $count =  DB::table('institutes')->count();
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
     public function getRooms(Request $request)
    {
     
        $sms_inst_id = session('sms_inst_id');

        $blocks = DB::table('blocks')->where('institute_id',$sms_inst_id);
// getrooms with all blocks
$role_type = session('type');
$regionId = session('region_id');

if ($role_type === 'Regional Office') {
    $count = DB::table('blocks')
        ->join('rooms', 'blocks.id', '=', 'rooms.block_id')
        ->where('blocks.region_id', $regionId)
        ->count();
} elseif ($role_type === 'School' || $role_type === 'College') {
    $count = DB::table('blocks')
        ->join('rooms', 'blocks.id', '=', 'rooms.block_id')
        ->where('blocks.institute_id', $sms_inst_id)
        ->count();
} else {
    $count = DB::table('blocks')
        ->join('rooms', 'blocks.id', '=', 'rooms.block_id')
        ->count();
}

return response()->json(['count' => $count]); // Keep 'count' key for frontend compatibility
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

        $count = DB::table('plants')->where('institute_id',$sms_inst_id)->count();;

return response()->json(['count' => $count]); // Keep 'count' key for frontend compatibility
}
 public function getTransports(Request $request)
    {
     
        $sms_inst_id = session('sms_inst_id');

        $blocks = DB::table('transports')->where('institute_id',$sms_inst_id)->count();;

return response()->json(['count' => $blocks]); // Keep 'count' key for frontend compatibility
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
$title1 = "";
$title2 = "";
$title3 = "";

if ($role_type === 'School' || $role_type === 'College') {
    $title1 = "Funds";
$title2 = "Projects";
$title3 = "Assets";
    $tab1 = DB::table('fund_helds')->where('institute_id', $sms_inst_id)
    ->select( 'fund_heads.name as Head','fund_helds.balance',)
            ->join('fund_heads', 'fund_heads.id', '=', 'fund_helds.fund_head_id')
            ->get();
    
     $tab2 = DB::table('projects')
    ->where('institute_id', $sms_inst_id)
    ->select('status')
    ->selectRaw('COUNT(*) as project_count')
    ->selectRaw('SUM(cost) as total_cost')
    ->groupBy('status')
    ->get();

 $tab3 = DB::table('institute_assets')
    ->where('institute_id', $sms_inst_id)
    ->select(
        'asset_categories.name as Category', 
        DB::raw('COUNT(assets.id) as total_assets')
    )
    ->join('assets', 'assets.id', '=', 'institute_assets.asset_id')
    ->join('asset_categories', 'asset_categories.id', '=', 'assets.asset_category_id') // Fixed typo here
    ->groupBy('asset_categories.name')
    ->get();
}else if($role_type=='Regional Office'){
    $title1 = "Institutes";
$title2 = "Funds";
$title3 = "Projects";
    $tab1 = DB::table('institutes')->where('region_id', $regionId)->where('type','<>','Regional Office')->where('type','<>','Directorate')
    ->select('type', DB::raw('COUNT(*) as institute_count'))
    ->groupBy('type')
    ->get();
    
     $tab2 = DB::table('fund_helds')->join('institutes', 'fund_helds.institute_id', '=', 'institutes.id')
     ->where('institutes.region_id', $regionId)
    ->select( 'fund_heads.name as Head','fund_helds.balance',)
            ->join('fund_heads', 'fund_heads.id', '=', 'fund_helds.fund_head_id')
            ->get();
        $tab3 = DB::table('projects')->join('institutes', 'projects.institute_id', '=', 'institutes.id')
    ->where('institutes.region_id', $regionId)
    ->select('projects.status')
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
$institute = Institute::where('hr_id',$hrInstituteId)->first();

     if ($institute) {
         session(['sms_inst_id' => $institute->id]);
     }

    $user = Auth::user();
    $roleIds = $user?->roles()->pluck('id');

    // Fallback: if you also store a role name on users.role, try mapping it to a Role id
    if (($roleIds?->count() ?? 0) === 0 && !empty($user?->role)) {
        $fallbackRoleId = \Spatie\Permission\Models\Role::where('name', $user->role)->value('id');
        $roleIds = collect(array_filter([$fallbackRoleId]));
    }

    $cards = collect();
    if (($roleIds?->count() ?? 0) > 0) {
        $cards = DashboardCard::whereIn('role_id', $roleIds)->get();
    }


        
    
        return Inertia::render('dashboard', [
           
            'cards' => $cards,
            'tab1' => $tab1,
            'tab2' => $tab2,
            'tab3' => $tab3,
            'title1' => $title1,
            'title2' => $title2,
            'title3' => $title3,
        ]);
    }
}
