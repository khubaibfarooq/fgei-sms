<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;

class Upgradation extends Model
{
    use HasFactory,HasRoles;

    protected $fillable = [
        'institute_id',
        'details',
        'from',
        'to',
        'status',
        'added_date',
        'added_by',
        'approved_date',
        'approved_by'
    ];

    public function institute()
    {
        return $this->belongsTo(Institute::class);
    }

    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
