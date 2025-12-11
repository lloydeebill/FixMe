<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RepairerAvailability extends Model
{
    use HasFactory;

    protected $fillable = [
        'repairer_profile_id',
        'day_of_week',
        'start_time',
        'end_time',
        'is_active'
    ];

    // Optional: Helper to get the name of the day (0 = Sunday)
    public function getDayNameAttribute()
    {
        return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][$this->day_of_week];
    }
}
