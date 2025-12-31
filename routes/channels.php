<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('helpdesk.{helpDeskId}', function ($user, $helpDeskId) {
    $helpDesk = \App\Models\HelpDesk::find($helpDeskId);
    if (!$helpDesk) {
        return false;
    }
    // Allow the ticket owner or any staff member (for now, authenticated user)
    // You might want to restrict this further based on roles
    return (int) $user->id === (int) $helpDesk->user_id || auth()->check();
});
