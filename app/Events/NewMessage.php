<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewMessage implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;
    public $receiverId; // <--- WE ADD THIS MANUALLY

    // We pass the Message object AND the ID of the person receiving it
    public function __construct(Message $message, $receiverId)
    {
        $this->message = $message;
        $this->receiverId = $receiverId;
    }

    public function broadcastOn(): array
    {
        // Broadcast to the specific user's private channel
        return [
            new PrivateChannel('messages.' . $this->receiverId),
        ];
    }

    public function broadcastAs(): string
    {
        // The event name the frontend listens for (remember the dot!)
        return 'message.sent';
    }
}
