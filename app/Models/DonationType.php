<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;

class DonationType extends Model
{
    use HasFactory,HasRoles;
         protected $fillable = ['name'];
          public function Donations()
    {
        return $this->hasMany(Donations::class);
    }
}
