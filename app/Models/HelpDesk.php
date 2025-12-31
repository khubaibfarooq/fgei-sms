<?php

namespace App\Models;


use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
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
          public function institute(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Institute::class);
    }
    /**
     * Get the user who created the help desk ticket.
     */
    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the user who provided feedback for the help desk ticket.
     */
    public function feedbackBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'feedback_by');
    }

    public function messages(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(HelpDeskMessage::class);
    }
}
