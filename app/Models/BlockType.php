<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;

class BlockType extends Model
{
    use HasFactory,HasRoles;

    protected $fillable = ['name','room_type_ids'];

    public function blocks()
    {
        return $this->hasMany(Block::class);
    }
}
