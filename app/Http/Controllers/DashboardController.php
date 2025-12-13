<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\RepairerProfile;
use App\Models\Booking;
use App\Models\User;

class DashboardController extends Controller
{
    public function index()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // 1. Load Relationship for "Switch to Work Mode"
        $user->load('repairerProfile');

        // --- PREPARE REPAIRER DATA (For the Pro Dashboard) ---
        $schedule = [];
        $jobs = [];
        $isGoogleConnected = false;

        if ($user->repairerProfile) {
            $isGoogleConnected = !empty($user->google_refresh_token);

            $schedule = $user->repairerProfile->availabilities()
                ->orderBy('day_of_week', 'asc')
                ->get();

            // Default schedule if empty
            if ($schedule->isEmpty()) {
                $schedule = collect(range(0, 6))->map(function ($day) {
                    return [
                        'day_of_week' => $day, // Ensure DB maps 0-6 to Mon-Sun correctly or use strings
                        'start_time' => '09:00',
                        'end_time' => '17:00',
                        'is_active' => false,
                    ];
                });
            }

            $jobs = Booking::with('customer')
                ->where('repairer_id', $user->repairerProfile->repairer_id)
                ->latest()
                ->get();
        }

        // --- PREPARE CUSTOMER DATA (For the Customer Dashboard) ---

        // D. Fetch Next Appointment
        $nextBooking = Booking::with('repairer.user')
            ->where('customer_id', $user->user_id)
            ->where('status', 'confirmed')
            ->where('scheduled_at', '>=', now())
            ->orderBy('scheduled_at', 'asc')
            ->first();

        $appointment = null;
        if ($nextBooking) {
            $date = \Carbon\Carbon::parse($nextBooking->scheduled_at);
            $appointment = [
                'exists' => true,
                'day' => $date->format('d'),
                'month' => $date->format('M'),
                'time' => $date->format('h:i A'),
                'type' => $nextBooking->service_type,
                'repairer' => $nextBooking->repairer->user->name ?? 'Repairer',
                'status' => $nextBooking->status,
            ];
        }

        // E. Fetch Top Services (🛑 FIX APPLIED HERE)
        // We fetch the PROFILE, but we Eager Load the USER and AVAILABILITIES
        // E. Fetch Top Services (FIXED: Exclude Self)
        $topServices = RepairerProfile::with(['user', 'availabilities'])
            ->where('user_id', '!=', $user->user_id) // 🛑 ADD THIS LINE
            ->latest()
            ->take(6)
            ->get()
            ->map(function ($profile) {
                return [
                    'id' => $profile->user->user_id, // Ensure we map the ID correctly
                    'name' => $profile->user->name ?? 'Unknown',
                    'role' => $profile->focus_area,
                    'rating' => $profile->rating,
                    'image' => 'https://ui-avatars.com/api/?background=random&color=fff&name=' . urlencode($profile->user->name ?? 'U'),
                    'repairer_profile' => $profile,
                ];
            });

        // F. Static Data
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
            'isRepairer' => $user->isRepairer ?? false,
            'repairers' => User::where('user_id', '!=', Auth::id())
                ->has('repairerProfile')
                ->with(['repairerProfile.location']) // 👈 Eager load the location table
                ->get(),
            'profile' => $user->repairerProfile,

            // Repairer Props
            'schedule' => $schedule,
            'isGoogleConnected' => $isGoogleConnected,
            'jobs' => $jobs,

            // Customer Props
            'appointment' => $appointment,
            'quickAccess' => $quickAccess,
            'history' => $history,
            'topServices' => $topServices, // Now contains availability data!
        ]);
    }
}
