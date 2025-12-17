<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApprovalStage extends Model
{
    use HasFactory;

    protected $fillable = [
        'stage_name',
        'project_type_id',
        'stage_order',
        'description',
        'is_mandatory',
        'users_can_approve',
        'is_last',
        'level',
        'is_user_required'
    ];

    protected $casts = [
        'is_mandatory' => 'boolean',
        'users_can_approve' => 'array',
        'is_last' => 'boolean',
        'is_user_required' => 'boolean',
    ];

    public function projectType()
    {
        return $this->belongsTo(ProjectType::class);
    }
}
