<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\RepairerAvailability;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Google\Client as GoogleClient;
use Google\Service\Calendar as GoogleCalendar;

class RepairerAvailabilityController extends Controller
{
    public function edit()
    {
        $user = Auth::user();

        $repairerId = $user->repairerProfile->id;

        // Fetch existing schedule from DB
        // Note: The database column is 'repairer_profile_id', which is correct.
        $availabilities = RepairerAvailability::where('repairer_profile_id', $repairerId)
            ->orderBy('day_of_week')
            ->get();

        // If no schedule exists yet, generate a default template (Mon-Sun)
        if ($availabilities->isEmpty()) {
            $availabilities = collect(range(0, 6))->map(function ($day) {
                return [
                    'day_of_week' => $day,
                    'start_time' => '09:00',
                    'end_time' => '17:00',
                    'is_active' => false, // Default to OFF
                ];
            });
        }

        return Inertia::render('Dashboard/Repairer/Availability', [
            'schedule' => $availabilities
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'schedule' => 'required|array',
            'schedule.*.day_of_week' => 'required|integer|between:0,6',
            'schedule.*.start_time' => 'required',
            'schedule.*.end_time' => 'required',
            'schedule.*.is_active' => 'boolean',
        ]);

        $user = Auth::user();

        $repairerId = $user->repairerProfile->id;

        foreach ($request->schedule as $dayData) {
            RepairerAvailability::updateOrCreate(
                [
                    // Match the correct foreign key column
                    'repairer_profile_id' => $repairerId,
                    'day_of_week' => $dayData['day_of_week']
                ],
                [
                    'start_time' => $dayData['start_time'],
                    'end_time' => $dayData['end_time'],
                    'is_active' => $dayData['is_active']
                ]
            );
        }

        return back()->with('success', 'Schedule updated successfully!');
    }

    public function checkAvailability(Request $request)
    {
        $request->validate(['date' => 'required|date']);

        $user = Auth::user();

        $repairerId = $user->repairerProfile->id;

        $date = Carbon::parse($request->date);
        $dayOfWeek = $date->dayOfWeek; // 0 (Sunday) to 6 (Saturday)

        // 1. Get Standard Hours
        $schedule = RepairerAvailability::where('repairer_profile_id', $repairerId)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->first();

        if (!$schedule) {
            return response()->json(['slots' => []]);
        }

        // 2. Fetch Google Events
        $googleEvents = $this->fetchGoogleEvents($user, $date);

        // 3. Generate Slots & Subtract Conflicts
        $availableSlots = [];
        $startTime = Carbon::parse($request->date . ' ' . $schedule->start_time);
        $endTime = Carbon::parse($request->date . ' ' . $schedule->end_time);
        $durationMinutes = 60; // Slot duration

        while ($startTime->copy()->addMinutes($durationMinutes) <= $endTime) {
            $slotEnd = $startTime->copy()->addMinutes($durationMinutes);

            if (!$this->isOverlapping($startTime, $slotEnd, $googleEvents)) {
                $availableSlots[] = $startTime->format('H:i');
            }

            $startTime->addMinutes($durationMinutes);
        }

        return response()->json(['slots' => $availableSlots]);
    }

    private function fetchGoogleEvents($user, $date)
    {
        $client = new GoogleClient();
        $client->setAccessToken($user->google_calendar_token);

        $service = new GoogleCalendar($client);
        $calendarId = 'primary';

        $optParams = [
            'orderBy' => 'startTime',
            'singleEvents' => true,
            'timeMin' => $date->copy()->startOfDay()->toRfc3339String(),
            'timeMax' => $date->copy()->endOfDay()->toRfc3339String(),
        ];

        try {
            $results = $service->events->listEvents($calendarId, $optParams);
            return $results->getItems();
        } catch (\Exception $e) {
            return [];
        }
    }

    private function isOverlapping($slotStart, $slotEnd, $events)
    {
        foreach ($events as $event) {
            if (empty($event->start->dateTime)) continue; // Skip all-day events

            $eventStart = Carbon::parse($event->start->dateTime);
            $eventEnd = Carbon::parse($event->end->dateTime);

            if ($slotStart < $eventEnd && $slotEnd > $eventStart) {
                return true;
            }
        }
        return false;
    }
}
