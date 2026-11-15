<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Message;
use App\Models\UserNotification;

class NotificationRecorder
{
    public function record(Booking $booking, int $recipientId, int $actorId, string $type, string $eventKey, ?Message $message = null): void
    {
        if ($recipientId === $actorId) return;

        UserNotification::firstOrCreate(
            ['user_id' => $recipientId, 'event_key' => $eventKey],
            ['booking_id' => $booking->id, 'message_id' => $message?->id, 'type' => $type],
        );
    }
}
