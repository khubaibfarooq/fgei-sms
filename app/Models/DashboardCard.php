<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Traits\HasRoles;

class DashboardCard extends Model
{
    use HasFactory, HasRoles;

    protected $table = 'dashboard_cards';

    protected $fillable = [
        'title',
        'link',
        'color',
        'role_id',        // now stores: "1,3,5" or "admin,teacher"
        'icon',
        'redirectlink',
    ];

    // Cast role_id as array automatically
    protected $casts = [
        'role_id' => 'array', // Laravel will auto-convert comma/string to array
    ];

    // Optional: If you store role names (not IDs), use this instead:
    // protected $casts = ['role_id' => 'array'];

    /**
     * Get the roles associated with the dashboard card
     */
    public function roles()
    {
        // If you're storing ROLE IDs (e.g., "1,3,5")
        if (is_numeric($this->role_id[0] ?? null)) {
            return Role::whereIn('id', $this->role_id)->get();
        }

       
    }

    /**
     * Scope: Filter cards visible to current user
     */
public function scopeVisibleTo($query, $user)
{
    if (!$user) return $query->whereRaw('1=0');

    $roleIds = $user->roles->pluck('id')->toArray();
    $roleNames = $user->getRoleNames()->toArray();

    return $query->where(function ($q) use ($roleIds, $roleNames) {
        foreach ($roleIds as $id) {
            $q->orWhere('role_id', 'LIKE', "%{$id}%");
        }
        foreach ($roleNames as $name) {
            $q->orWhere('role_id', 'LIKE', "%{$name}%");
        }
    });
}
}