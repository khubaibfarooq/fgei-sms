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
        'budget', // Renamed from cost 
        'institute_id',
        'project_type_id',
        'status',
        'description',
        'submitted_by',
        'current_stage_id',
        'overall_status',
        'priority'
    ];

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
