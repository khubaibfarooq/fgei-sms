<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Notification extends Model
{
    protected $fillable = [
        'title',
        'message',
        'type',
        'link',
    ];

    /**
     * Get the users who have read this notification.
     */
    public function readByUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'notification_reads')
            ->withPivot('read_at');
    }

    /**
     * Get the read records for this notification.
     */
    public function reads(): HasMany
    {
        return $this->hasMany(NotificationRead::class);
    }

    /**
     * Scope a query to only include notifications unread by the current user.
     */
    public function scopeUnreadByUser($query, $userId = null)
    {
        $userId = $userId ?? auth()->id();
        
        return $query->whereDoesntHave('reads', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        });
    }

    /**
     * Scope a query to only include notifications read by the current user.
     */
    public function scopeReadByUser($query, $userId = null)
    {
        $userId = $userId ?? auth()->id();
        
        return $query->whereHas('reads', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        });
    }

    /**
     * Check if the notification has been read by a specific user.
     */
    public function isReadByUser($userId = null): bool
    {
        $userId = $userId ?? auth()->id();
        
        return $this->reads()->where('user_id', $userId)->exists();
    }

    /**
     * Mark the notification as read for a specific user.
     */
    public function markAsReadByUser($userId = null): void
    {
        $userId = $userId ?? auth()->id();
        
        // Use updateOrCreate to avoid duplicate entries
        NotificationRead::updateOrCreate(
            [
                'notification_id' => $this->id,
                'user_id' => $userId,
            ],
            [
                'read_at' => now(),
            ]
        );
    }
}
