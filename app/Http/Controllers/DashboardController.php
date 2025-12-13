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
        // 1. Force a fresh User load with relationships
        // This is safer than Auth::user()->load()
        $user = User::with(['location', 'repairerProfile'])
            ->find(Auth::id());

        // --- PREPARE REPAIRER DATA ---
        $schedule = [];
        $jobs = [];
        $isGoogleConnected = false;

        if ($user->repairerProfile) {
            $isGoogleConnected = !empty($user->google_refresh_token);

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

            $jobs = Booking::with('customer')
                ->where('repairer_profile_id', $user->repairerProfile->id)
                ->latest()
                ->get();
        }

        // --- PREPARE CUSTOMER DATA ---
        $nextBooking = Booking::with('repairerProfile.user')
            ->where('customer_id', $user->user_id)
            ->where('status', 'confirmed')
            ->where('scheduled_at', '>=', now())
            ->orderBy('scheduled_at', 'asc')
            ->first();

        $appointment = null;
        if ($nextBooking) {
            $date = \Carbon\Carbon::parse($nextBooking->scheduled_at);
            $repairerName = $nextBooking->repairerProfile->user->name ?? 'Repairer';

            $appointment = [
                'exists' => true,
                'day' => $date->format('d'),
                'month' => $date->format('M'),
                'time' => $date->format('h:i A'),
                'type' => $nextBooking->service_type,
                'repairer' => $repairerName,
                'status' => $nextBooking->status,
            ];
        }

        $topServices = RepairerProfile::with(['user.location', 'location', 'availabilities', 'skills'])
            ->where('user_id', '!=', $user->user_id)
            ->latest()
            ->take(6)
            ->get()
            ->map(function ($profile) {
                $mainSkill = $profile->skills->first()->name ?? 'General Repairer';

                return [
                    'id' => $profile->user->user_id,
                    'name' => $profile->user->name ?? 'Unknown',
                    // Pass the User Location if Profile Location is missing
                    'location' => $profile->location ?? $profile->user->location,
                    'role' => $mainSkill,
                    'rating' => $profile->rating,
                    'image' => 'https://ui-avatars.com/api/?background=random&color=fff&name=' . urlencode($profile->user->name ?? 'U'),
                    'repairer_profile' => $profile,
                ];
            });

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

            // 🛑 CRITICAL FIX: Send location separately!
            // This bypasses the middleware stripping issue.
            'userLocation' => $user->location,

            'isRepairer' => $user->isRepairer ?? false,

            'repairers' => User::where('user_id', '!=', Auth::id())
                ->has('repairerProfile')
                ->with([
                    'location', // User location
                    'repairerProfile.location', // Business location
                    'repairerProfile.skills',
                    'repairerProfile.availabilities'
                ])
                ->get(),

            'profile' => $user->repairerProfile,
            'schedule' => $schedule,
            'isGoogleConnected' => $isGoogleConnected,
            'jobs' => $jobs,
            'appointment' => $appointment,
            'quickAccess' => $quickAccess,
            'history' => $history,
            'topServices' => $topServices,
        ]);
    }
}
