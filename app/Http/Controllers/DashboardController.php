<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\RepairerProfile;
use App\Models\Booking; // <--- DON'T FORGET THIS IMPORT

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
        $jobs = []; // <--- 2. INITIALIZE THE JOBS ARRAY

        // Only fetch this if they actually have a repairer profile
        if ($user->repairerProfile) {

            // A. Check Google Calendar Status
            $isGoogleConnected = !empty($user->google_refresh_token);

            // B. Fetch Availability Schedule
            $schedule = $user->repairerProfile->availabilities()
                ->orderBy('day_of_week', 'asc')
                ->get();

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

            // --- THIS WAS MISSING: FETCH REAL BOOKINGS (JOBS) ---
            $jobs = Booking::with('customer') // Assumes Booking belongsTo Customer
                ->where('repairer_id', $user->repairerProfile->repairer_id)
                ->orderBy('created_at', 'desc')
                ->get();
            // ----------------------------------------------------
        }

        // 3. Fetch Real Repairers (For Customer View)
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

        // 4. Static Data
        $quickAccess = [
            ['name' => 'Repairer', 'iconType' => 'repairer'],
            ['name' => 'Cleaning', 'iconType' => 'cleaning'],
            ['name' => 'Plumbing', 'iconType' => 'plumbing'],
            ['name' => 'Electrical', 'iconType' => 'electrical'],
        ];
        $history = ['lastJob' => 'Welcome!', 'count' => 0];


        // 5. Return to React
        return Inertia::render('Dashboard', [
            'auth' => ['user' => $user],
            'isRepairer' => $user->isRepairer ?? false,
            'profile' => $user->repairerProfile,

            // --- PASS THE DATA ---
            'schedule' => $schedule,
            'isGoogleConnected' => $isGoogleConnected,
            'jobs' => $jobs, // <--- NOW PASSING REAL JOBS TO FRONTEND
            // ---------------------

            'appointment' => null,
            'quickAccess' => $quickAccess,
            'history' => $history,
            'topServices' => $topServices,
        ]);
    }
}
