<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Notifications\VerifyEmail;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable;

    protected $primaryKey = 'user_id';

    protected $appends = ['is_repairer', 'id'];

    protected $fillable = [
        'name',
        'email',
        'password',
        'role', // 👈 ADDED: Necessary for OnboardingController to set 'repairer' vs 'customer'
        'gender',
        'location_id',
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

    public function getIdAttribute()
    {
        return $this->user_id;
    }

    // --- ONBOARDING LOGIC ---

    public function profileIsComplete(): bool
    {
        // Added checks for name/DOB to be safe
        return !empty($this->name) &&
            !empty($this->gender) &&
            !empty($this->location_id) &&
            !empty($this->date_of_birth);
    }

    public function roleIsSelected(): bool
    {
        // This logic is fine for now; essentially if the profile is filled, we assume they picked a role.
        return $this->profileIsComplete();
    }

    public function repairerDetailsAreComplete(): bool
    {
        $profile = $this->repairerProfile;

        // 1. If not a repairer (no profile), they are "complete" as a customer.
        if (!$profile) {
            return true;
        }

        // 2. Check Business Name
        if (empty($profile->business_name)) {
            return false;
        }

        // 3. 🛑 FIX: Check SKILLS instead of 'focus_area'
        // We deleted focus_area, so we check if they have selected any skills.
        if ($profile->skills()->count() === 0) {
            return false;
        }

        return true;
    }
}
