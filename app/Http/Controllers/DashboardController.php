<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\RepairerProfile;
use App\Models\Booking;
use App\Models\User;
use App\Models\Conversation;

class DashboardController extends Controller
{
    public function index()
    {
        // 1. Force a fresh User load with relationships
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

            $repairerReviews = \App\Models\Review::where('repairer_id', $user->user_id)
                ->with('customer') // Get customer name/avatar
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

        // LOGIC: You calculate appointment here correctly
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

        // 1. FETCH HISTORY (Completed Jobs)
        $history = Booking::where('customer_id', $user->user_id)
            ->where('status', 'completed')
            ->with(['repairerProfile', 'review'])

            // 👇 ADD THIS: Count the reviews (0 or 1)
            ->withCount('review')

            // 👇 PRIMARY SORT: Put '0' (Unreviewed) before '1' (Reviewed)
            ->orderBy('review_count', 'asc')

            // 👇 SECONDARY SORT: Within those groups, show newest first
            ->orderBy('scheduled_at', 'desc')

            ->get();

        // 2. FETCH ACTIVE APPOINTMENT (Redundant query removed, strictly relying on $nextBooking logic above is safer, but keeping logic consistent)

        $conversations = Booking::with(['conversation.messages' => function ($query) {
            $query->latest()->limit(1);
        }, 'customer', 'repairerProfile.user'])
            ->where('customer_id', $user->user_id)
            ->orWhereHas('repairerProfile', function ($q) use ($user) {
                $q->where('user_id', $user->user_id);
            })
            ->latest()
            ->get()
            ->map(function ($booking) use ($user) {
                $isMeCustomer = $booking->customer_id === $user->user_id;

                if ($isMeCustomer) {
                    $otherUserName = $booking->repairerProfile->business_name ?? $booking->repairerProfile->user->name ?? 'Repairer';
                } else {
                    $otherUserName = $booking->customer->name ?? 'Customer';
                }

                $chat = $booking->conversation;
                $lastMsg = $chat ? $chat->messages->first() : null;

                return [
                    'id' => $chat ? $chat->id : 'new_' . $booking->id,
                    'booking_id' => $booking->id,
                    'other_user_name' => $otherUserName,
                    'service_type' => $booking->service_type,
                    'last_message_content' => $lastMsg ? $lastMsg->content : 'Booking confirmed. Tap to chat!',
                    'last_message_time' => $lastMsg ? $lastMsg->created_at->diffForHumans() : $booking->created_at->diffForHumans(),
                    'unread_count' => 0,
                ];
            });

        // 4. Return to React
        return Inertia::render('Dashboard', [
            'auth' => ['user' => $user],
            'userLocation' => $user->location,
            'isRepairer' => $user->isRepairer ?? false,

            'repairers' => User::where('user_id', '!=', Auth::id())
                ->has('repairerProfile')
                ->with([
                    'location',
                    'repairerProfile.location',
                    'repairerProfile.skills',
                    'repairerProfile.availabilities'
                ])
                ->get(),

            'profile' => $user->repairerProfile,
            'schedule' => $schedule,
            'isGoogleConnected' => $isGoogleConnected,
            'jobs' => $jobs,

            // --- FIXED SECTION BELOW ---
            'quickAccess' => $quickAccess,
            'topServices' => $topServices,
            'conversations' => $conversations,
            'history' => $history,

            // Use the $appointment variable we calculated at the top. 
            // If it's null, send ['exists' => false]
            'appointment' => $appointment ? $appointment : ['exists' => false],
            'repairerReviews' => $repairerReviews ?? [],
        ]);
    }
}
