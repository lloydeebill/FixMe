<?php

namespace App\Http\Controllers;

use App\Models\UserNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function open(Request $request, UserNotification $notification): RedirectResponse
    {
        abort_unless($notification->user_id === $request->user()->user_id, 403);
        $booking = $notification->booking()->with('repairerProfile')->firstOrFail();
        abort_unless(in_array($request->user()->user_id, [
            $booking->customer_id,
            $booking->repairerProfile?->user_id,
        ], true), 403);

        $mode = $request->validate(['mode' => 'nullable|in:client,provider'])['mode']
            ?? ($request->user()->repairerProfile ? 'provider' : 'client');
        $destination = ['from' => 'notifications', 'mode' => $mode];

        if ($notification->type === 'booking_requested') {
            abort_unless($booking->repairerProfile?->user_id === $request->user()->user_id, 403);
            if (! $notification->read_at) $notification->update(['read_at' => now()]);
            return $booking->status === 'pending'
                ? redirect()->route('dashboard', ['tab' => 'jobs', 'job' => 'pending', 'booking' => $booking->id, ...$destination])
                : redirect()->route('bookings.show', ['id' => $booking->id, ...$destination]);
        }

        if (! $notification->read_at) $notification->update(['read_at' => now()]);

        return $notification->type === 'new_message'
            ? redirect()->route('chat.test', ['bookingId' => $booking->id, ...$destination])
            : redirect()->route('bookings.show', ['id' => $booking->id, ...$destination]);
    }
}
