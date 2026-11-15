<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\RepairerProfile;
use App\Models\Booking;
use App\Models\User;
use App\Models\Conversation;
use App\Models\Skill;
use App\Models\UserNotification;
use App\Services\GeoDistance;

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
        $repairerReviews = [];

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

            // REPAIRER JOBS LOGIC
            $providerLocation = $user->repairerProfile->location;
            $jobs = Booking::with(['customer'])
                ->where('repairer_profile_id', $user->repairerProfile->id)
                ->latest()
                ->get()
                ->map(function ($job) use ($providerLocation) {
                    $locationVisible = in_array($job->status, ['pending', 'confirmed', 'in_progress', 'completion_requested', 'completion_disputed', 'completed'], true);
                    $distanceKm = $locationVisible ? GeoDistance::between(
                        $job->job_latitude === null ? null : (float) $job->job_latitude,
                        $job->job_longitude === null ? null : (float) $job->job_longitude,
                        $providerLocation?->latitude === null ? null : (float) $providerLocation->latitude,
                        $providerLocation?->longitude === null ? null : (float) $providerLocation->longitude,
                    ) : null;
                    return [
                        'id' => $job->id,
                        'status' => $job->status,
                        'service_type' => $job->service_type,
                        'scheduled_at' => $job->scheduled_at,
                        'updated_at' => $job->updated_at,
                        'problem_description' => $job->problem_description,
                        'price' => $job->price ?? null,
                        ...($locationVisible ? [
                            'latitude' => $job->job_latitude,
                            'longitude' => $job->job_longitude,
                            'service_location' => [
                                'address' => $job->location_snapshot,
                                'latitude' => $job->job_latitude,
                                'longitude' => $job->job_longitude,
                            ],
                            'provider_location' => [
                                'address' => $providerLocation?->address,
                                'latitude' => $providerLocation?->latitude,
                                'longitude' => $providerLocation?->longitude,
                            ],
                            'distance_km' => $distanceKm === null ? null : round($distanceKm, 1),
                        ] : []),
                        'customer' => ['name' => $job->customer?->name],
                        'completion_issue_reason' => $job->completion_issue_reason,
                        'client_accepted_at' => $job->client_accepted_at,
                        'payment_method' => $job->payment_method,
                        'client_payment_reported_at' => $job->client_payment_reported_at,
                        'provider_payment_confirmed_at' => $job->provider_payment_confirmed_at,
                    ];
                });

            $repairerReviews = \App\Models\Review::where('repairer_id', $user->user_id)
                ->with('customer')
                ->latest()
                ->get();
        }

        // --- PREPARE CUSTOMER DATA (USER MODE) ---
        $nextBooking = Booking::with('repairerProfile.user')
            ->where('customer_id', $user->user_id)
            ->where('status', 'confirmed')
            ->where('scheduled_at', '>=', now())
            ->orderBy('scheduled_at', 'asc')
            ->first();

        // LOGIC: Calculate appointment
        $appointment = null;
        if ($nextBooking) {
            $date = \Carbon\Carbon::parse($nextBooking->scheduled_at);

            $repairerName = $nextBooking->repairerProfile?->business_name
                ?: $nextBooking->repairerProfile?->user?->name;

            $appointment = [
                'exists' => true,
                'id' => $nextBooking->id, // Required for chat
                'day' => $date->format('d'),
                'month' => $date->format('M'),
                'time' => $date->format('h:i A'),
                'type' => $nextBooking->service_type,
                'repairer' => $repairerName,
                'status' => $nextBooking->status,
            ];
        }

        $topServices = RepairerProfile::with(['user', 'location', 'availabilities', 'skills'])
            ->where('user_id', '!=', $user->user_id)
            ->latest()
            ->take(6)
            ->get()
            ->map(function ($profile) {
                $mainSkill = $profile->skills->first()->name ?? 'General Repairer';
                $displayName = $profile->business_name ?? $profile->user->name ?? 'Unknown';

                return [
                    'id' => $profile->user->user_id,
                    'name' => $displayName,
                    'location' => $profile->location,
                    'role' => $mainSkill,
                    'rating' => $profile->rating,
                    'image' => 'https://ui-avatars.com/api/?background=random&color=fff&name=' . urlencode($displayName),
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
            ->withCount('review')
            ->orderBy('review_count', 'asc')
            ->orderBy('scheduled_at', 'desc')
            ->get();

        $completionJobs = Booking::where('customer_id', $user->user_id)
            ->whereIn('status', ['completion_requested', 'completion_disputed'])
            ->with('repairerProfile')
            ->latest()
            ->get();

        // Conversation order follows the latest actual message, not booking creation.
        $conversations = Booking::with(['conversation.messages' => function ($query) {
            $query->orderByDesc('created_at')->orderByDesc('id')->limit(1);
        }, 'customer', 'repairerProfile.user'])


            ->where('status', '!=', 'pending')

            ->where(function ($q) use ($user) {
                $q->where('customer_id', $user->user_id)
                    ->orWhereHas('repairerProfile', function ($q2) use ($user) {
                        $q2->where('user_id', $user->user_id);
                    });
            })
            ->get()
            ->map(function ($booking) use ($user) {
                $isMeCustomer = $booking->customer_id === $user->user_id;

                if ($isMeCustomer) {
                    $otherUserName = $booking->repairerProfile->business_name
                        ?? $booking->repairerProfile->user->name
                        ?? 'Repairer';
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
                    'last_message_content' => $lastMsg?->content,
                    'last_message_time' => $lastMsg?->created_at?->diffForHumans(),
                    'last_message_at' => $lastMsg?->created_at?->toISOString(),
                    'last_message_id' => $lastMsg?->id,
                ];
            })
            ->sort(function ($a, $b) {
                $byTime = strcmp($b['last_message_at'] ?? '', $a['last_message_at'] ?? '');
                return $byTime ?: (($b['last_message_id'] ?? 0) <=> ($a['last_message_id'] ?? 0));
            })->values();

        $notificationQuery = UserNotification::where('user_id', $user->user_id);
        $unreadNotificationsCount = (clone $notificationQuery)->whereNull('read_at')->count();
        $notifications = $notificationQuery->with('booking:id,repairer_profile_id,service_type,problem_description')
            ->orderByDesc('created_at')->orderByDesc('id')->limit(50)->get()
            ->map(fn ($notice) => [
                'id' => $notice->id,
                'type' => $notice->type,
                'service_type' => $notice->booking?->service_type,
                'job_description' => $notice->type === 'booking_requested'
                    && $notice->booking?->repairer_profile_id === $user->repairerProfile?->id
                    ? $notice->booking->problem_description : null,
                'created_at' => $notice->created_at->toISOString(),
                'time' => $notice->created_at->diffForHumans(),
                'read' => (bool) $notice->read_at,
            ]);

        $jobCounts = [
            'pending' => collect($jobs)->where('status', 'pending')->count(),
            'active' => collect($jobs)->whereIn('status', ['confirmed', 'in_progress', 'completion_requested', 'completion_disputed'])->count(),
            'completed' => collect($jobs)->where('status', 'completed')->count(),
        ];

        return Inertia::render('Dashboard', [
            'auth' => ['user' => $user],
            'userLocation' => $user->location,
            'isRepairer' => $user->isRepairer ?? false,

            'repairers' => User::where('user_id', '!=', Auth::id())
                ->has('repairerProfile')
                ->with([
                    'repairerProfile.location',
                    'repairerProfile.skills',
                    'repairerProfile.availabilities'
                ])
                ->get(),

            'profile' => $user->repairerProfile,
            'schedule' => $schedule,
            'isGoogleConnected' => $isGoogleConnected,
            'jobs' => $jobs,

            'quickAccess' => $quickAccess,
            'topServices' => $topServices,
            'conversations' => $conversations,
            'notifications' => $notifications,
            'unreadNotificationsCount' => $unreadNotificationsCount,
            'jobCounts' => $jobCounts,
            'history' => $history,
            'completionJobs' => $completionJobs,

            'appointment' => $appointment ? $appointment : ['exists' => false],
            'repairerReviews' => $repairerReviews ?? [],
            'serviceCategories' => Skill::catalog()->get(['id', 'name', 'slug', 'service_group', 'description', 'search_terms']),
        ]);
    }
}
