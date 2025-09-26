<?php

namespace App\Models;
use Spatie\Permission\Traits\HasRoles;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    use HasFactory,HasRoles;

    protected $fillable = ['name', 'asset_category_id', 'details'];

    public function category()
    {
        return $this->belongsTo(AssetCategory::class, 'asset_category_id');
    }

    public function instituteAssets()
    {
        return $this->hasMany(InstituteAsset::class);
    }
}
