<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;

class Block extends Model
{
    use HasFactory,HasRoles;

    protected $fillable = ['name', 'area', 'institute_id','block_type_id'];

    public function institute()
    {
        return $this->belongsTo(Institute::class);
    }
 public function blocktype()
    {
        return $this->belongsTo(BlockType::class);
    }
    public function rooms()
    {
        return $this->hasMany(Room::class);
    }
}
