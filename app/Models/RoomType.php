<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;

class RoomType extends Model
{
    use HasFactory,HasRoles;

    protected $fillable = ['name','assets_id'];

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }
}
