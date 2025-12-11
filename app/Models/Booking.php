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
    'status',
    'problem_description',
    'location_snapshot'
  ];

  protected $casts = [
    'scheduled_at' => 'datetime',
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
