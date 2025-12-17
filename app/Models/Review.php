<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    // 👇 THIS IS THE MISSING PART
    protected $fillable = [
        'booking_id',
        'customer_id',
        'repairer_id',
        'rating',
        'comment',
    ];

    // --- Relationships (You'll need these later to display them) ---

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id', 'user_id');
    }

    public function repairer()
    {
        return $this->belongsTo(User::class, 'repairer_id', 'user_id');
    }
}
