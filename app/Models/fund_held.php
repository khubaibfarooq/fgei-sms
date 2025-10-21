<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FundHeld extends Model
{ use HasFactory,HasRoles;
    protected $table = 'fund_helds';

    protected $fillable = [
        'institute_id',
        'fund_head_id',
        'balance',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    public function institute(): BelongsTo
    {
        return $this->belongsTo(Institute::class);
    }

    public function fundHead(): BelongsTo
    {
        return $this->belongsTo(FundHead::class);
    }
}