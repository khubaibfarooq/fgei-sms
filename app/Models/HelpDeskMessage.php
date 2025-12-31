<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HelpDeskMessage extends Model
{
    protected $fillable = ['help_desk_id', 'user_id', 'message', 'is_read'];

    public function helpDesk(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(HelpDesk::class);
    }

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
