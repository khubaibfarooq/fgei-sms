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
        $count =  DB::table('help_desks')->where('status',$request->status)->count();

        return response()->json(['count' => $count]);
    }
     public function getActivitylog()
    { 
        $count =  DB::table('activity_log')->count();

        return response()->json(['count' => $count]);
    }
   public function getFunds(Request $request)
    {
        $regionId = session('region_id');
        $role_type = session('type');
        $sms_inst_id = session('sms_inst_id');

        $query = DB::table('fund_held');

        if ($role_type === 'Regional Office') {
            $sum = $query->where('region_id', $regionId)->sum('amount'); // Adjust 'amount' to your column name
        } elseif ($role_type === 'School' || $role_type === 'College') {
            $sum = $query->where('sms_inst_id', $sms_inst_id)->sum('amount'); // Adjusted column name
        } else {
            $sum = $query->sum('amount'); // Total sum for other roles
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
public function index(Request $request)
{
   
    $role_type = session('type');
    $hrInstituteId = session('inst_id');
    $regionId = session('region_id');
// dd(session());
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
        ]);
    }
}
