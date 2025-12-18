<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    use HasFactory;

    protected $guarded = [];

    // 1. Link to the Booking
    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    // 2. Link to the Messages (One conversation has many messages)
    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    // 3. Link to the Sender (User)
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id', 'user_id');
    }

    // 4. Link to the Receiver (User)
    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id', 'user_id');
    }
}
