<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = ['booking_id', 'sender_id', 'receiver_id'];

    // Relationship: A conversation has many messages
    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    // Relationship: A conversation belongs to a Booking
    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}
