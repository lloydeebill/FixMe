<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\RepairerAvailability;
use Illuminate\Support\Facades\Auth;

class RepairerAvailabilityController extends Controller
{
    public function edit()
    {
        $user = Auth::user();
        // Assuming user has a relationship 'repairerProfile'
        $repairerId = $user->repairerProfile->repairer_id;

        // Fetch existing schedule from DB
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

        return Inertia::render('Repairer/Availability', [
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
        $repairerId = $user->repairerProfile->repairer_id;

        foreach ($request->schedule as $dayData) {
            RepairerAvailability::updateOrCreate(
                [
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
}
