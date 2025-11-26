<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RepairerProfile extends Model
{
    use HasFactory;

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
        // Links this profile back to the User using the correct user_id column
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'repairer_skill', 'repairer_profile_id', 'skill_id');
    }
}
