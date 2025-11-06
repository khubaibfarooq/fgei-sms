<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transaction extends Model
{use HasFactory,HasRoles;
    protected $table = 'transactions';

    protected $fillable = [
        'institute_id',
        'added_by',
        'total_amount',
        'type',
        'status',
        'bill_img',
        'approved_by',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
    ];

    // -----------------------------------------------------------------
    // Relationships
    // -----------------------------------------------------------------

    public function institute(): BelongsTo
    {
        return $this->belongsTo(Institute::class);
    }

    public function addedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function details(): HasMany
    {
        return $this->hasMany(TransactionDetail::class, 'tid');
    }
}