<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Conversation;
use App\Models\Message;
use App\Events\NewMessage; // Use the correct Event name
use App\Models\Booking;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    // 1. Get messages
    public function fetchMessages($bookingId)
    {
        $conversation = Conversation::where('booking_id', $bookingId)->first();

        if (!$conversation) {
            return response()->json([]);
        }

        // Return messages with the sender info so the UI can show names/avatars
        return response()->json($conversation->messages()->with('sender')->get());
    }

    // 2. Send message
    public function sendMessage(Request $request, $bookingId)
    {
        $request->validate(['message' => 'required|string']);
        $user = Auth::user();

        // A. Identify the Booking and the Participants
        // We MUST use 'with' to grab the linked profile, then the linked user
        $booking = Booking::with('repairerProfile')->findOrFail($bookingId);

        // 1. Get Customer ID (Easy, it's right there)
        $customerUserId = $booking->customer_id;

        // 2. Get Repairer User ID (Harder, we must go through the profile)
        // logic: Booking -> RepairerProfile -> user_id
        if (!$booking->repairerProfile) {
            return redirect()->back()->withErrors(['message' => 'No repairer assigned yet.']);
        }
        $repairerUserId = $booking->repairerProfile->user_id;

        // B. Determine Receiver
        // We check against the current user's ID
        if ($user->user_id == $customerUserId) {
            // I am the Customer -> Send to the Repairer's USER ID (not profile ID)
            $receiverId = $repairerUserId;
        } else {
            // I am the Repairer -> Send to the Customer
            $receiverId = $customerUserId;
        }
        // C. Find or Create the Conversation Room (Based on Booking ID)
        $conversation = Conversation::firstOrCreate(
            ['booking_id' => $bookingId],
            [
                // These run only if creating a NEW conversation
                'sender_id' => $user->id,
                'receiver_id' => $receiverId
            ]
        );

        // D. Create the Message in DB
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'content' => $request->message
        ]);

        // E. Load sender info for the frontend
        $message->load('sender');

        // F. Broadcast! (Pass the message AND the calculated receiverId)
        broadcast(new NewMessage($message, $receiverId))->toOthers();

        return redirect()->back();
    }
}
