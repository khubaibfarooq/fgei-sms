<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;


class Project extends Model
{
 use HasFactory,HasRoles;

    protected $fillable = [
        'name', 
        'estimated_amount', // Renamed from budget 
        'actual_amount',
        'final_comments',
        'institute_id',
        'fund_head_id',
        'project_type_id', // Keeping for now if needed for other logic, but stages are global
        'status',
        'description',
        'submitted_by',
        'current_stage_id',
        'overall_status',
        'priority'
    ];

    public function fundHead()
    {
        return $this->belongsTo(FundHead::class);
    }

    public function institute()
    {
        return $this->belongsTo(Institute::class);
    }
    
    public function submitter()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function currentStage()
    {
        return $this->belongsTo(ApprovalStage::class, 'current_stage_id');
    }

    public function approvals()
    {
        return $this->hasMany(ProjectApproval::class);
    }
 public function projecttype()
    {
    return $this->belongsTo(ProjectType::class, 'project_type_id');
    }
 public function region()
{
    return $this->institute?->region ?? null;
}
   
    public function milestones()
    {
        return $this->hasMany(Milestone::class);
    }
}
