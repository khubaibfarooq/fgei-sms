<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\NotificationRead;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user.
     */
    public function index()
    {
        $userId = auth()->id();
        
        $notifications = Notification::with(['reads' => function ($query) use ($userId) {
                $query->where('user_id', $userId);
            }])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        // Add is_read attribute to each notification
        $notifications->getCollection()->transform(function ($notification) use ($userId) {
            $notification->is_read = $notification->reads->isNotEmpty();
            $notification->read_at = $notification->reads->first()?->read_at;
            unset($notification->reads);
            return $notification;
        });

        return Inertia::render('notifications/Index', [
            'notifications' => $notifications,
            'permissions' => [
                'can_add' => auth()->user()->can('notifications.create'),
                'can_edit' => auth()->user()->can('notifications.edit'),
                'can_delete' => auth()->user()->can('notifications.delete'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new notification.
     */
    public function create()
    {
       if (!auth()->user()->can('notifications.create')) {
        abort(403, 'You do not have permission to add a notification.');
    }
        return Inertia::render('notifications/Form');
    }

    /**
     * Store a newly created notification.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'required|in:info,success,warning,error',
            'link' => 'nullable|string|max:255',
        ]);

        Notification::create($validated);

        return redirect()->route('notifications.index')
            ->with('success', 'Notification created successfully.');
    }

    /**
     * Show the form for editing the specified notification.
     */
    public function edit(Notification $notification)
    {
       if (!auth()->user()->can('notifications.edit')) {
        abort(403, 'You do not have permission to edit a notification.');
    }
        return Inertia::render('notifications/Form', [
            'notification' => $notification,
        ]);
    }

    /**
     * Update the specified notification.
     */
    public function update(Request $request, Notification $notification)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'required|in:info,success,warning,error',
            'link' => 'nullable|string|max:255',
        ]);

        $notification->update($validated);

        return redirect()->route('notifications.index')
            ->with('success', 'Notification updated successfully.');
    }

    /**
     * Get unread notifications for the authenticated user (for header dropdown).
     */
    public function unread()
    {
        $userId = auth()->id();
        
        $notifications = Notification::unreadByUser($userId)
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($notification) {
                $notification->is_read = false;
                return $notification;
            });

        $unreadCount = Notification::unreadByUser($userId)->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Mark a notification as read for the current user.
     */
    public function markAsRead(Notification $notification)
    {
        $notification->markAsReadByUser(auth()->id());

        return response()->json(['success' => true]);
    }

    /**
     * Mark all notifications as read for the current user.
     */
    public function markAllAsRead()
    { 
        $userId = auth()->id();
        
        // Get all unread notification IDs
        $unreadNotificationIds = Notification::unreadByUser($userId)
            ->pluck('id');

        // Insert read records for all unread notifications
        $now = now();
        $records = $unreadNotificationIds->map(function ($notificationId) use ($userId, $now) {
            return [
                'notification_id' => $notificationId,
                'user_id' => $userId,
                'read_at' => $now,
            ];
        })->toArray();

        if (!empty($records)) {
            NotificationRead::insert($records);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Delete a notification.
     */
    public function destroy(Notification $notification)
    {
       if (!auth()->user()->can('notifications.delete')) {
        abort(403, 'You do not have permission to delete a notification.');
    }
        $notification->delete();

        return redirect()->route('notifications.index')
            ->with('success', 'Notification deleted successfully.');
    }
}
