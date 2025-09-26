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
}
