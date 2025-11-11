<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;

class Room extends Model
{
    use HasFactory,HasRoles;

    protected $fillable = ['name', 'area', 'room_type_id', 'block_id', 'img'];

    public function type()
    {
        return $this->belongsTo(RoomType::class, 'room_type_id');
    }

    public function block()
    {
        return $this->belongsTo(Block::class);
    }
}
