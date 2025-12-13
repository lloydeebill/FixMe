<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Notifications\VerifyEmail;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo; // 👈 Import this

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable;

    protected $primaryKey = 'user_id';

    // 1. APPENDS: Add 'id' so React doesn't break
    protected $appends = ['is_repairer', 'id'];

    protected $fillable = [
        'name',
        'email',
        'password',
        'gender',
        'location_id', // ✅ CORRECT: This replaces the old 'location' string
        'date_of_birth',
        'google_calendar_token',
        'google_refresh_token',
        'google_token_expires_in',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function sendEmailVerificationNotification()
    {
        $this->notify(new VerifyEmail);
    }

    // --- RELATIONSHIPS ---

    // ✅ CORRECT: Link to the new Location table
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function repairerProfile(): HasOne
    {
        return $this->hasOne(RepairerProfile::class, 'user_id', 'user_id');
    }

    public function bookingsAsCustomer(): HasMany
    {
        return $this->hasMany(Booking::class, 'customer_id', 'user_id');
    }

    // --- ACCESSORS ---

    public function getIsRepairerAttribute(): bool
    {
        return $this->repairerProfile()->exists();
    }

    // 🛑 CRITICAL FIX: React expects 'id', but we have 'user_id'. 
    // This creates a fake 'id' field in the JSON.
    public function getIdAttribute()
    {
        return $this->user_id;
    }

    // --- ONBOARDING LOGIC ---

    public function profileIsComplete(): bool
    {
        // 🛑 UPDATE: Check 'location_id' instead of the old 'location' string
        return $this->gender !== null && $this->location_id !== null;
    }

    public function roleIsSelected(): bool
    {
        // 🛑 CRITICAL FIX: The "Infinite Loop" Fix
        // For customers, role is selected when their profile is complete.
        // Do NOT check repairerProfile()->exists() here, or customers can never login.
        return $this->profileIsComplete();
    }

    public function repairerDetailsAreComplete(): bool
    {
        $profile = $this->repairerProfile;

        if (!$profile) {
            return true; // Not a repairer, so details are "complete"
        }

        return $profile->business_name !== null &&
            $profile->focus_area !== null &&
            $profile->business_name !== $this->name . ' Repairs';
    }
}
