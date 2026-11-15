<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Booking extends Model
{
  use HasFactory;

  protected $fillable = [
    'customer_id',
    'repairer_profile_id',
    'service_type',
    'scheduled_at',
    'end_time',
    'status',
    'problem_description',
    'location_snapshot',
    'service_area',
    'job_latitude',
    'job_longitude',
    'google_event_id',
    'completion_requested_at',
    'client_accepted_at',
    'completion_issue_reason',
    'payment_method',
    'client_payment_reported_at',
    'provider_payment_confirmed_at',
  ];

  protected $casts = [
    'scheduled_at' => 'datetime',
    'end_time' => 'datetime',
    'completion_requested_at' => 'datetime',
    'client_accepted_at' => 'datetime',
    'client_payment_reported_at' => 'datetime',
    'provider_payment_confirmed_at' => 'datetime',
  ];

  // Connectivity back to User (Customer)
  public function customer()
  {
    return $this->belongsTo(User::class, 'customer_id', 'user_id');
  }

  // Connectivity back to Repairer Profile
  public function repairerProfile()
  {

    // and link it to the RepairerProfile class (which uses standard 'id' now)
    return $this->belongsTo(RepairerProfile::class, 'repairer_profile_id');
  }

  public function conversation()
  {
    return $this->hasOne(Conversation::class);
  }

  public function scopeActive($query)
  {
    return $query->whereIn('status', ['pending', 'confirmed', 'in_progress', 'completion_requested', 'completion_disputed']);
  }

  // Scope for Completed Jobs
  public function scopeCompleted($query)
  {
    return $query->where('status', 'completed');
  }

  public function review()
  {
    // A booking has one review
    return $this->hasOne(Review::class);
  }
}
