<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectEffect extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'effect_type',
        'effect_data',
        'applied',
        'applied_at',
        'applied_by',
    ];

    protected $casts = [
        'effect_data' => 'array',
        'applied'     => 'boolean',
        'applied_at'  => 'datetime',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function appliedByUser()
    {
        return $this->belongsTo(User::class, 'applied_by');
    }
}
