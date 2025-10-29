<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Traits\HasRoles;

class DashboardCard extends Model
{
    use HasFactory,HasRoles;
 protected $table = 'dashboard_cards';
    protected $fillable = [
        'title',
        'link',
          'color',
        'role_id',
        'redirectlink',
    ];

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }
}
