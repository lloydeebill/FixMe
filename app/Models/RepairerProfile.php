<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RepairerProfile extends Model
{
    use HasFactory;

    // Correct custom primary key
    protected $primaryKey = 'repairer_id';

    protected $fillable = [
        'user_id',
        'business_name',
        'focus_area',
        'bio',
        'rating',
        'clients_helped',
    ];

    /**
     * Get the User that owns the RepairerProfile.
     */
    public function user(): BelongsTo
    {
        // Links back to User using 'user_id' on both sides
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'repairer_skill', 'repairer_profile_id', 'skill_id');
    }

    public function bookingsAsRepairer(): HasMany
    {
        return $this->hasMany(Booking::class, 'repairer_id', 'repairer_id');
    }

    public function availabilities(): HasMany
    {
        return $this->hasMany(RepairerAvailability::class, 'repairer_profile_id', 'repairer_id');
    }
}
