<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectApproval extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'stage_id',
        'approver_id',
        'status',
        'action_date',
        'comments',
        'deadline'
    ];

    protected $casts = [
        'action_date' => 'datetime',
        'deadline' => 'date'
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function stage()
    {
        return $this->belongsTo(ApprovalStage::class, 'stage_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
