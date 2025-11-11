<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;

class FundHead extends Model
{
       use HasFactory,HasRoles;
         protected $fillable = ['name','parent_id','type'];
          public function Funds()
    {
        return $this->hasMany(Funds::class);
    }
}
