<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;


class Skill extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug'];

    public function repairers(): BelongsToMany
    {
        return $this->belongsToMany(
            RepairerProfile::class,
            'repairer_skill',
            'skill_id',
            'repairer_profile_id'
        );
    }
}
