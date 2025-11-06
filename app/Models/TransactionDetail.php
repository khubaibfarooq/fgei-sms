<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TransactionDetail extends Model
{use HasFactory,HasRoles;
    protected $table = 'transaction_details';

    protected $fillable = [
        'fund_head_id',
        'tid',
        'asset_id',
        'room_id',
        'amount',
        'qty',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'qty'   => 'integer',
    ];

    // -----------------------------------------------------------------
    // Relationships
    // -----------------------------------------------------------------

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'tid');
    }

    public function fundHead(): BelongsTo
    {
        return $this->belongsTo(FundHead::class);
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