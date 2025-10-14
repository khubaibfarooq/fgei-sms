<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;
class ProjectType extends Model
{
   use HasFactory,HasRoles;

    protected $fillable = ['name'];
     public function projects()
    {
        return $this->hasMany(Project::class);
    }
}
