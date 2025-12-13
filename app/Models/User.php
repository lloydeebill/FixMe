<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Notifications\VerifyEmail;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable;

    protected $primaryKey = 'user_id';

    // 1. APPEND THE VIRTUAL ATTRIBUTE
    // This makes 'is_repairer' appear in your React props automatically
    protected $appends = ['is_repairer'];

    protected $fillable = [
        'name',
        'email',
        'password',
        // 'isRepairer', // REMOVED
        'gender',
        'location',
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

    public function repairerProfile(): HasOne
    {
        return $this->hasOne(RepairerProfile::class, 'user_id', 'user_id');
    }

    public function bookingsAsCustomer(): HasMany
    {
        return $this->hasMany(Booking::class, 'customer_id', 'user_id');
    }

    // --- ACCESSORS (The Magic) ---

    // 2. DEFINE THIS ONLY ONCE
    // Accessed via $user->is_repairer
    public function getIsRepairerAttribute(): bool
    {
        return $this->repairerProfile()->exists();
    }

    // --- ONBOARDING LOGIC ---

    public function profileIsComplete(): bool
    {
        return $this->gender !== null && $this->location !== null;
    }

    public function roleIsSelected(): bool
    {
        // If profile exists, they selected Repairer.
        // Note: If you want to track "Customer Selected", you might need a different check, 
        // but for now, assuming existence = repairer is fine.
        return $this->repairerProfile()->exists();
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
