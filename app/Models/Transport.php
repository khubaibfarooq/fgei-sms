<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;

class Transport extends Model
{
    use HasFactory,HasRoles;

    protected $fillable = ['vehicle_no', 'vehicle_type_id', 'institute_id'];

    public function vehicleType()
    {
        return $this->belongsTo(VehicleType::class);
    }

    public function institute()
    {
        return $this->belongsTo(Institute::class);
    }
}
