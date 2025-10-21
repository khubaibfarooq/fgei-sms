<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Permission\Traits\HasRoles;
class FundDetail extends Model
{  use HasFactory,HasRoles;
    protected $table = 'fund_details';

    protected $fillable = [
        'fund_id',
        'asset_id',
        'room_id',
        'amount',
        'qty',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'qty' => 'integer',
    ];

    public function fund(): BelongsTo
    {
        return $this->belongsTo(Fund::class);
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}