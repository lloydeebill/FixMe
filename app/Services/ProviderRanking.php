<?php

namespace App\Services;

use App\Models\RepairerProfile;
use App\Models\Skill;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * Pilot ranking: 60 * max(0, 1 - straight-line km / 50) + 40 if the
 * requested slot is available. With no slot, availability adds zero points.
 * Profiles without a saved provider pin or a chosen job pin sort after those
 * with a calculable distance. Unknown-distance profiles sort by requested
 * availability (when known), then display name and profile ID.
 * Certificate data is deliberately excluded.
 */
class ProviderRanking
{
    public function __construct(private BookingSlot $slots) {}

    public function rank(Skill $category, string $area, ?float $jobLat, ?float $jobLng, ?CarbonImmutable $requestedAt, int $viewerId): Collection
    {
        $range = (float) config('pilot_areas.distance_range_km', 50);

        return RepairerProfile::query()
            ->where('user_id', '!=', $viewerId)
            ->whereJsonContains('service_areas', $area)
            ->whereHas('skills', fn ($query) => $query->where('skills.id', $category->id))
            ->with(['user', 'location', 'skills', 'availabilities'])
            ->get()
            ->map(function (RepairerProfile $profile) use ($category, $jobLat, $jobLng, $requestedAt, $range) {
                $providerLat = $profile->location?->latitude;
                $providerLng = $profile->location?->longitude;
                $distance = $jobLat !== null && $jobLng !== null && $providerLat !== null && $providerLng !== null
                    ? GeoDistance::between($jobLat, $jobLng, (float) $providerLat, (float) $providerLng)
                    : null;
                $available = $requestedAt === null ? null : $this->slots->availabilityError($profile->id, $requestedAt) === null
                    && ! $this->slots->confirmedAtSameStart($profile->id, $requestedAt);
                $distancePoints = $distance === null ? 0 : 60 * max(0, 1 - $distance / $range);
                $score = round($distancePoints + ($available ? 40 : 0), 1);

                return [
                    'user_id' => $profile->user_id,
                    'name' => $profile->user?->name,
                    'repairer_profile' => [
                        'id' => $profile->id,
                        'business_name' => $profile->business_name,
                        'bio' => $profile->bio,
                        'rating' => $profile->rating,
                        'location' => $profile->location,
                        'skills' => $profile->skills,
                        'availabilities' => $profile->availabilities,
                        'service_areas' => $profile->service_areas,
                    ],
                    'suggestion' => [
                        'service' => $category->name,
                        'distance_km' => $distance === null ? null : round($distance, 1),
                        'availability' => $available === null ? 'not_checked' : ($available ? 'available' : 'unavailable'),
                        'score' => $score,
                    ],
                ];
            })
            ->sort(function ($a, $b) {
                $left = $a['suggestion']['distance_km'];
                $right = $b['suggestion']['distance_km'];
                if (($left === null) !== ($right === null)) return $left === null ? 1 : -1;
                if ($left !== null && ($points = $b['suggestion']['score'] <=> $a['suggestion']['score'])) return $points;
                if ($left !== null && ($distance = $left <=> $right)) return $distance;
                if ($left === null && ($availability = $b['suggestion']['score'] <=> $a['suggestion']['score'])) return $availability;
                $name = strcasecmp($a['repairer_profile']['business_name'] ?: ($a['name'] ?: ''), $b['repairer_profile']['business_name'] ?: ($b['name'] ?: ''));
                return $name ?: ($a['repairer_profile']['id'] <=> $b['repairer_profile']['id']);
            })
            ->values();
    }

}
