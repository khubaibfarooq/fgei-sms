<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class Milestone extends Model
{
        use HasFactory,HasRoles;
    protected $fillable = ['name', 'description', 'due_date', 'project_id', 'status', 'completed_date', 'img', 'pdf', 'added_by'];

     public function project():BelongsTo    
    {
        return $this->belongsTo(Project::class);
    }

}
