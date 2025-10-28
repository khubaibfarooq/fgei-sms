<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;


class Project extends Model
{
 use HasFactory,HasRoles;

    protected $fillable = ['name', 'cost', 'institute_id','project_type_id','status'];

    public function institute()
    {
        return $this->belongsTo(Institute::class);
    }
 public function projecttype()
    {
        return $this->belongsTo(ProjectType::class);
    }
 public function region()
{
    return $this->institute?->region ?? null;
}
   
}
