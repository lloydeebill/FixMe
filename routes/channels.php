<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

// The {userId} segment matches the ID you broadcasted in the NewMessage event
Broadcast::channel('messages.{userId}', function (User $user, $userId) {
    // Only allow the currently authenticated user ($user->id) to listen to their own channel ($userId)
    return (int) $user->id === (int) $userId;
});
