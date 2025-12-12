<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
  protected $fillable = [
    'customer_id',
    'repairer_id',
    'service_type',
    'scheduled_at',
    // 🚨 ADD THIS: Needed for Google Calendar duration
    'end_time',
    'status',
    'problem_description',
    'location_snapshot',
    // 🚨 ADD THIS: Needed to store the Google ID after syncing
    'google_event_id',
  ];

  protected $casts = [
    'scheduled_at' => 'datetime',
    // 🚨 ADD THIS: Makes it easy to format for Google API
    'end_time' => 'datetime',
  ];

  // Connectivity back to User
  public function customer()
  {
    return $this->belongsTo(User::class, 'customer_id', 'user_id');
  }

  // Connectivity back to Repairer
  public function repairer()
  {
    return $this->belongsTo(RepairerProfile::class, 'repairer_id', 'repairer_id');
  }
}
