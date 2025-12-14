<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Conversation;
use App\Models\Message;
use App\Events\MessageSent;
use App\Models\Booking;
use App\Models\User;

class ChatController extends Controller
{
    // 1. Get all messages for a specific job (Booking)
    public function fetchMessages($bookingId)
    {
        // Find the conversation linked to this booking
        $conversation = Conversation::where('booking_id', $bookingId)->first();

        // If no chat starts yet, return empty list
        if (!$conversation) {
            return response()->json([]);
        }

        // Return messages with the sender info (so we know who is who)
        return response()->json($conversation->messages()->with('sender')->get());
    }

    // 2. Send a new message
    public function sendMessage(Request $request, $bookingId)
    {
        $user = auth()->user();

        // Validation (Basic)
        $request->validate(['message' => 'required|string']);

        // Find the booking to know who the OTHER person is
        $booking = Booking::findOrFail($bookingId);

        // Determine who is the receiver
        // If I am the customer, receiver is the provider. If I am provider, receiver is customer.
        $receiverId = ($booking->user_id === $user->id)
            ? $booking->provider_id // Assuming your Booking table has 'provider_id' (or 'repairer_id')
            : $booking->user_id;

        // 1. Find or Create the Conversation Room
        $conversation = Conversation::firstOrCreate(
            ['booking_id' => $bookingId],
            [
                'sender_id' => $user->id,
                'receiver_id' => $receiverId
            ]
        );

        // 2. Save the Message
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'content' => $request->message
        ]);

        // 3. Broadcast to Pusher (Real-time magic)
        broadcast(new MessageSent($message))->toOthers();

        return response()->json(['status' => 'Message Sent!', 'message' => $message]);
    }
}
