<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Traits\HasRoles;

class DashboardCard extends Model
{
    use HasFactory,HasRoles;

    protected $fillable = [
        'title',
        'link',
        'role_id',
    ];

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }
}
