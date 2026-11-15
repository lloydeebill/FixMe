<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Conversation;
use App\Models\Message;
use App\Events\NewMessage; // Use the correct Event name
use App\Models\Booking;
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Services\NotificationRecorder;

class ChatController extends Controller
{
    // 1. Get messages
    public function fetchMessages(Request $request, $bookingId)
    {
        $booking = Booking::with('repairerProfile')->findOrFail($bookingId);
        $this->authorizeParticipant($request, $booking);

        $conversation = Conversation::where('booking_id', $bookingId)->first();

        if (!$conversation) {
            return response()->json([]);
        }

        // Return messages with the sender info so the UI can show names/avatars
        return response()->json($conversation->messages()->with('sender')->get());
    }

    // 2. Send message
    public function sendMessage(Request $request, $bookingId, NotificationRecorder $notifier)
    {
        $booking = Booking::with('repairerProfile')->findOrFail($bookingId);
        $this->authorizeParticipant($request, $booking);
        $request->validate(['message' => 'required|string']);
        $user = $request->user();

        // 1. Get Customer ID 
        $customerUserId = $booking->customer_id;

        // 2. Get Repairer User ID 
        $repairerUserId = $booking->repairerProfile->user_id;

        // B. Determine Receiver
        if ($user->user_id == $customerUserId) {
            // I am the Customer -> Send to the Repairer's USER ID (not profile ID)
            $receiverId = $repairerUserId;
        } else {
            // I am the Repairer -> Send to the Customer
            $receiverId = $customerUserId;
        }
        // C. Find or Create the Conversation Room (Based on Booking ID)
        $message = DB::transaction(function () use ($booking, $bookingId, $user, $receiverId, $request, $notifier) {
            $conversation = Conversation::firstOrCreate(
                ['booking_id' => $bookingId],
                ['sender_id' => $user->id, 'receiver_id' => $receiverId]
            );
            $message = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $user->id,
                'content' => $request->message,
            ]);
            $notifier->record($booking, $receiverId, $user->id, 'new_message', "message:{$message->id}", $message);
            return $message;
        });

        // E. Load sender info for the frontend
        $message->load('sender');

        // Broadcasting is optional; the saved message remains available through polling.
        try {
            broadcast(new NewMessage($message, $receiverId, $booking->id))->toOthers();
        } catch (BroadcastException $exception) {
            Log::warning('Chat broadcast failed', [
                'exception_type' => $exception::class,
                'connection' => config('broadcasting.default'),
            ]);
        }

        return response()->json(['message' => $message], 201);
    }

    private function authorizeParticipant(Request $request, Booking $booking): void
    {
        abort_unless($booking->repairerProfile && in_array($request->user()?->user_id, [
            $booking->customer_id,
            $booking->repairerProfile->user_id,
        ], true), 403);
    }
}
