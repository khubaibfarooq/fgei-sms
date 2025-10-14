<?php

namespace App\Models;


use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;

class HelpDesk extends Model
{
     use HasFactory,HasRoles;
         protected $fillable = ['token','title','description','attachment','user_id','institute_id','status','feedback','feedback_by','feedback_date'];
         protected static function boot()
    {
        parent::boot();

        // Generate a random token when creating a new record
        static::creating(function ($model) {
            if (empty($model->token)) {
                $model->token = mt_rand(10000000, 99999999); // 8-digit random number
                // Ensure uniqueness by checking the database
                while (static::where('token', $model->token)->exists()) {
                    $model->token = mt_rand(10000000, 99999999);
                }
            }
        });
    }
          public function institute()
    {
        return $this->belongsTo(Institute::class);
    }
     public function user()
    {
        return $this->belongsTo(User::class);
    }
}
