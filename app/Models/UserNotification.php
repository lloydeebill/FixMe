<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserNotification extends Model
{
    protected $fillable = ['user_id', 'booking_id', 'message_id', 'type', 'event_key', 'read_at'];

    protected $casts = ['read_at' => 'datetime'];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}
