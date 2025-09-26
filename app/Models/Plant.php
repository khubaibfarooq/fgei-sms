<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;

class Plant extends Model
{
    use HasFactory,HasRoles;

    protected $fillable = ['name', 'qty', 'institute_id'];

    public function institute()
    {
        return $this->belongsTo(Institute::class);
    }
}
