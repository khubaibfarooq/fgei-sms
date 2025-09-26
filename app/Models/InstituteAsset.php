<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;

class InstituteAsset extends Model
{
    use HasFactory,HasRoles;

    protected $fillable = ['institute_id', 'asset_id', 'current_qty', 'added_by', 'added_date'];

    public function institute()
    {
        return $this->belongsTo(Institute::class);
    }

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function transactions()
    {
        return $this->hasMany(AssetTransaction::class);
    }
}
