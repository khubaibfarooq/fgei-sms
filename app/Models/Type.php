<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;

class Type extends Model
{
    use HasFactory, HasRoles;
    
    protected $fillable = ['name', 'parent_id', 'module','isblock','isroom','isasset'];
    
    public function parent()
    {
        return $this->belongsTo(Type::class, 'parent_id');
    }
    
    public function children()
    {
        return $this->hasMany(Type::class, 'parent_id');
    }
}
