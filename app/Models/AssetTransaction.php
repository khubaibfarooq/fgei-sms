<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;

class AssetTransaction extends Model
{
    use HasFactory,HasRoles;

    protected $fillable = [
        'institute_id',
        'institute_asset_id',
        'qty',
        'details',
        'status',
        'added_by',
        'added_date',
        'approved_date',
        'approved_by'
    ];

    public function institute()
    {
        return $this->belongsTo(Institute::class);
    }

    public function instituteAsset()
    {
        return $this->belongsTo(InstituteAsset::class);
    }
}
