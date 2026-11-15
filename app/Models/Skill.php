<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;


class Skill extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'service_group', 'description', 'search_terms', 'sort_order', 'is_active'];

    protected $casts = ['search_terms' => 'array', 'is_active' => 'boolean'];

    public function scopeCatalog($query)
    {
        return $query->where('is_active', true)->whereNotNull('service_group')->orderBy('sort_order');
    }

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
