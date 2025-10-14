<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;

class Donation extends Model
{
   use HasFactory,HasRoles;

    protected $fillable = ['details','donation_type_id', 'amount','institute_id','added_date'];

    public function donationType()
    {
        return $this->belongsTo(DonationType::class);
    } public function institute()
    {
        return $this->belongsTo(Institute::class);
    }
}
