<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Location;

class RepairerProfile extends Model
{
    use HasFactory;

    // Standard primary key is 'id', so we don't strictly need to declare it, 
    // but it's good for clarity since we just switched back.
    protected $primaryKey = 'id';

    protected $fillable = [
        'user_id',
        'location_id',
        'business_name',
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

    /**
     * Get the Location associated with the profile.
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * The skills that belong to the repairer.
     */
    public function skills(): BelongsToMany
    {
        // Pivot table: 'repairer_skill'
        // Foreign Key on pivot: 'repairer_profile_id'
        // Related Key on pivot: 'skill_id'
        return $this->belongsToMany(Skill::class, 'repairer_skill', 'repairer_profile_id', 'skill_id');
    }

    /**
     * Get all bookings for this repairer.
     */
    public function bookingsAsRepairer(): HasMany
    {
        // 🛑 FIX: Changed foreign key from 'repairer_id' to 'repairer_profile_id'
        return $this->hasMany(Booking::class, 'repairer_profile_id');
    }

    /**
     * Get availabilities (schedule) for this repairer.
     */
    public function availabilities(): HasMany
    {
        // 🛑 FIX: Changed foreign key from 'repairer_id' to 'repairer_profile_id'
        return $this->hasMany(RepairerAvailability::class, 'repairer_profile_id');
    }
}
