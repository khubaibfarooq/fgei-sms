<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\HasMedia;

class Institute extends Model implements HasMedia
{
        use HasFactory, Notifiable, HasRoles, InteractsWithMedia;

   /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
   
    protected $guarded = [];
 
    public function shifts()
    { 
        return $this->hasMany(Shift::class);
    }
    public function fundHelds()
    { 
        return $this->hasMany(FundHeld::class);
    }
    public function blocks()
    { 
        return $this->hasMany(Block::class);
    }
    public function rooms()
    { 
        return $this->hasMany(Room::class);
    }
   
    public function instituteAssets()
    { 
        return $this->hasMany(InstituteAsset::class);
    }
    public function institutePlants()
    { 
        return $this->hasMany(Plant::class);
    }
    public function instituteTransports()
    { 
        return $this->hasMany(Transport::class);
    }
    public function projects()
    { 
        return $this->hasMany(Project::class);
    }
    public function upgradations()
    { 
        return $this->hasMany(Upgradation::class);
    }
}
