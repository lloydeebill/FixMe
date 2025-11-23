<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RepairerProfile extends Model
{
    use HasFactory;

    protected $primaryKey = 'repairer_id';

    // The table name is set implicitly as 'repairer_profiles'

    protected $fillable = [
        'user_id',
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
        // Links this profile back to the User using the correct user_id column
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
