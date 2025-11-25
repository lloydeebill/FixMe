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
}
