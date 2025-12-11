<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\RepairerProfile;

class DashboardController extends Controller
{
    public function index()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // 1. Load Relationship for "Switch to Work Mode"
        $user->load('repairerProfile');

        // --- NEW LOGIC: PREPARE REPAIRER DATA ---
        $schedule = [];
        $isGoogleConnected = false;

        // Only fetch this if they actually have a repairer profile
        if ($user->repairerProfile) {

            // A. Check Google Calendar Status (True if token exists)
            $isGoogleConnected = !empty($user->google_refresh_token);

            // B. Fetch Availability Schedule
            // We use the relationship we defined earlier
            $schedule = $user->repairerProfile->availabilities()
                ->orderBy('day_of_week', 'asc')
                ->get();

            // C. Fallback: If they haven't set a schedule yet, send a default one (Mon-Sun, Offline)
            if ($schedule->isEmpty()) {
                $schedule = collect(range(0, 6))->map(function ($day) {
                    return [
                        'day_of_week' => $day,
                        'start_time' => '09:00',
                        'end_time' => '17:00',
                        'is_active' => false,
                    ];
                });
            }
        }
        // ----------------------------------------


        // 2. Fetch Real Repairers (For Customer View)
        $topServices = RepairerProfile::with('user')
            ->latest()
            ->take(6)
            ->get()
            ->map(function ($profile) {
                return [
                    'id' => $profile->repairer_id,
                    'name' => $profile->user->name ?? 'Unknown',
                    'role' => $profile->focus_area,
                    'rating' => $profile->rating,
                    'image' => 'https://ui-avatars.com/api/?background=random&color=fff&name=' . urlencode($profile->user->name ?? 'U'),
                ];
            });

        // 3. Static Data
        $quickAccess = [
            ['name' => 'Repairer', 'iconType' => 'repairer'],
            ['name' => 'Cleaning', 'iconType' => 'cleaning'],
            ['name' => 'Plumbing', 'iconType' => 'plumbing'],
            ['name' => 'Electrical', 'iconType' => 'electrical'],
        ];
        $history = ['lastJob' => 'Welcome!', 'count' => 0];

        // 4. Return to React
        return Inertia::render('Dashboard', [
            'auth' => ['user' => $user],
            'isRepairer' => $user->isRepairer ?? false, // Ensure your User model has this accessor or check profile existence
            'profile' => $user->repairerProfile,

            // --- PASS THE NEW DATA ---
            'schedule' => $schedule,
            'isGoogleConnected' => $isGoogleConnected,
            // -------------------------

            'appointment' => null,
            'quickAccess' => $quickAccess,
            'history' => $history,
            'topServices' => $topServices,
        ]);
    }
}
