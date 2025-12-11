<?php

namespace App\Models;

// 1. Imports for Verification, Notification, and Relationships
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Notifications\VerifyEmail; // For custom email sender
use Illuminate\Database\Eloquent\Relations\HasOne; // For the Repairer Profile relationship
use App\Models\RepairerProfile;

// 2. Class definition implements verification
class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable;

    protected $primaryKey = 'user_id';

    protected $fillable = [
        'name',
        'email',
        'password',
        'isRepairer',
        // 🛑 ADD THESE FIELDS FROM STEP 1 PROFILE SETUP:
        'gender',
        'location',
        'date_of_birth',
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
            'isRepairer' => 'boolean',
        ];
    }

    // 3. METHOD to use our custom email notification template (Fixes email sending)
    public function sendEmailVerificationNotification()
    {
        $this->notify(new VerifyEmail);
    }

    /**
     * 4. METHOD to define the repairer profile relationship (Fixes the undefined method error)
     * This makes $user->profile() available in the dashboard route.
     */
    public function repairerProfile(): HasOne
    {
        // Links this user to ONE RepairerProfile using the custom user_id key
        return $this->hasOne(RepairerProfile::class, 'user_id', 'user_id');
    }

    // --- ONBOARDING STATUS METHODS ---

    public function profileIsComplete(): bool
    {
        // STEP 1 CHECK: Check if the required fields from the first onboarding step (saveProfile) are set.
        // Assuming 'gender' and 'location' are mandatory fields set in Step 1.
        return $this->gender !== null && $this->location !== null;
    }

    public function roleIsSelected(): bool
    {
        // STEP 2 CHECK: Check if the role selection has occurred.
        // The 'isRepairer' field is set to either true or false in this step.
        // If it's still null, the role selection hasn't happened.
        // NOTE: You must add 'gender' and 'location' to your $fillable array if they are not there!
        return $this->isRepairer !== null;
    }

    public function repairerDetailsAreComplete(): bool
    {
        // STEP 3 CHECK: Check if the Repairer Profile is complete.

        // If the user is NOT a repairer, this step is automatically complete for them.
        if (!$this->isRepairer) {
            return true;
        }

        // If the user IS a repairer, check if the RepairerProfile exists AND has data.
        // The profile is created with defaults in saveRole, so we must check for the actual updated value.
        $profile = $this->repairerProfile;

        if ($profile) {
            // Check for a key field that is only set in the final step (saveRepairerDetails)
            return $profile->business_name !== null &&
                $profile->focus_area !== null &&
                $profile->business_name !== $this->name . ' Repairs'; // Check against the default value set in saveRole
        }

        // The profile record doesn't even exist yet (this usually means Step 2 failed)
        return false;
    }

    // app/Models/User.php

    // 1. Relationship: A User (Customer) has many Bookings
    public function bookingsAsCustomer()
    {
        return $this->hasMany(Booking::class, 'customer_id', 'user_id');
    }
}
