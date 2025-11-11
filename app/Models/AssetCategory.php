<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;

class AssetCategory extends Model
{
    use HasFactory,HasRoles;

    protected $fillable = ['name'];

    public function assets()
    {
        return $this->hasMany(Asset::class);
    }
}
