<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\RepairerAvailability;
use Carbon\CarbonImmutable;

class BookingSlot
{
    public function fromInput(string $value): CarbonImmutable
    {
        return CarbonImmutable::createFromFormat('!Y-m-d H:i', $value, config('app.timezone'));
    }

    public function availabilityError(int $profileId, CarbonImmutable $start): ?string
    {
        if ($start->lessThanOrEqualTo(CarbonImmutable::now(config('app.timezone')))) {
            return 'Choose a future booking time.';
        }

        $schedule = RepairerAvailability::where('repairer_profile_id', $profileId)
            ->where('day_of_week', $start->dayOfWeek)
            ->first();

        if (!$schedule || !$schedule->is_active) {
            return 'This provider is not available on the selected day.';
        }

        $time = $start->format('H:i:s');
        if ($schedule->start_time >= $schedule->end_time || $time < $schedule->start_time || $time >= $schedule->end_time) {
            return 'Choose a time within the provider’s working hours.';
        }

        return null;
    }

    public function confirmedAtSameStart(int $profileId, CarbonImmutable $start, ?int $exceptBookingId = null): bool
    {
        return Booking::where('repairer_profile_id', $profileId)
            ->where('scheduled_at', $start->format('Y-m-d H:i:s'))
            ->where('status', 'confirmed')
            ->when($exceptBookingId, fn ($query) => $query->where('id', '!=', $exceptBookingId))
            ->exists();
    }
}
