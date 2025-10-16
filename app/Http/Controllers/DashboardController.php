<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Institute;
use App\Models\DashboardCard;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
   
        $role_type=session('type');
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
