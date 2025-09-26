<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;

class Shift extends Model
{
    use HasFactory,HasRoles;

    protected $fillable = ['institute_id', 'name', 'building_type_id', 'building_name'];

    public function institute()
    {
        return $this->belongsTo(Institute::class);
    }

    public function buildingType()
    {
        return $this->belongsTo(BuildingType::class);
    }
}

