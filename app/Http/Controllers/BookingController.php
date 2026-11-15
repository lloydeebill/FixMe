<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\User;
use App\Models\RepairerProfile;
use App\Models\Skill;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Google\Client as GoogleClient;
use Google\Service\Calendar as GoogleCalendar;
use Google\Service\Calendar\Event;
use Inertia\Inertia;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Review;
use App\Services\BookingSlot;
use App\Services\NotificationRecorder;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;
use Illuminate\Database\UniqueConstraintViolationException;

class BookingController extends Controller
{

    // 0. LIST (Get My Bookings)
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Booking::query();

        if ($user->role === 'client') {
            $query->where('customer_id', $user->user_id);
        } elseif ($user->role === 'repairer') {
            $profile = RepairerProfile::where('user_id', $user->user_id)->first();
            if ($profile) {
                $query->where('repairer_profile_id', $profile->id);
            }
        }

        $active  = (clone $query)->active()->with(['repairerProfile', 'customer'])->get();

        $history = (clone $query)->completed()
            ->with(['repairerProfile', 'customer', 'review'])
            ->get();

        return response()->json([
            'active_jobs' => $active,
            'history'     => $history,
        ]);
    }
    // 1. STORE (Customer Creates Request)
    public function store(Request $request, BookingSlot $slots, NotificationRecorder $notifier)
    {
        $validated = $request->validate([
            'repairer_profile_id' => 'required|exists:repairer_profiles,id',
            'service_type'        => 'required|string|max:255',
            'scheduled_at'        => 'required|date_format:Y-m-d H:i',
            'problem_description' => 'nullable|string',
            'service_area' => ['required', Rule::in(array_keys(config('pilot_areas.areas')))],
            'job_address' => ['required', 'string', 'max:255'],
            'job_latitude' => ['required', 'numeric', 'between:-90,90'],
            'job_longitude' => ['required', 'numeric', 'between:-180,180'],
        ], [
            'scheduled_at.date_format' => 'Choose a valid date and time in the format YYYY-MM-DD HH:MM.',
        ]);

        $targetProfile = RepairerProfile::findOrFail($validated['repairer_profile_id']);

        if ($targetProfile->user_id === Auth::id()) {
            return back()->withErrors([
                'message' => 'You cannot book your own services! Switch to Repairer Mode.'
            ]);
        }
        if (! in_array($validated['service_area'], $targetProfile->service_areas ?? [], true)) {
            throw ValidationException::withMessages(['service_area' => 'This provider does not serve the selected job area.']);
        }
        $category = Skill::catalog()->where('name', $validated['service_type'])->first();
        if (! $category || ! $targetProfile->skills()->where('skills.id', $category->id)->exists()) {
            throw ValidationException::withMessages(['service_type' => 'Choose a service this provider offers.']);
        }

        // Booking timestamps and weekly working hours are interpreted in the app's Asia/Manila timezone.
        $startTime = $slots->fromInput($validated['scheduled_at']);
        if ($error = $slots->availabilityError($targetProfile->id, $startTime)) {
            throw ValidationException::withMessages(['scheduled_at' => $error]);
        }
        if ($slots->confirmedAtSameStart($targetProfile->id, $startTime)) {
            throw ValidationException::withMessages(['scheduled_at' => 'This time is already booked.']);
        }

        // Create Booking
        DB::transaction(function () use ($validated, $startTime, $request, $targetProfile, $notifier) {
            $booking = Booking::create([
                'customer_id'         => Auth::id(),
                'repairer_profile_id' => $validated['repairer_profile_id'],
                'service_type'        => $validated['service_type'],
                'scheduled_at'        => $startTime->format('Y-m-d H:i:s'),
                'status'              => 'pending',
                'problem_description' => $validated['problem_description'] ?? null,
                'location_snapshot' => $validated['job_address'],
                'service_area' => $validated['service_area'],
                'job_latitude' => $validated['job_latitude'],
                'job_longitude' => $validated['job_longitude'],
            ]);
            $notifier->record($booking, $targetProfile->user_id, Auth::id(), 'booking_requested', "booking_requested:{$booking->id}");
        });

        return redirect()->back()->with('message', 'Request sent! Waiting for repairer confirmation.');
    }

    // 2. APPROVE (Repairer Accepts & Syncs)
    public function approve(Request $request, $id, BookingSlot $slots, NotificationRecorder $notifier)
    {
        [$booking, $repairerProfile] = DB::transaction(function () use ($id, $slots, $notifier) {
            [$booking, $repairerProfile] = $this->lockedOwnedBooking($id);
            if ($booking->status !== 'pending') {
                throw ValidationException::withMessages(['message' => 'Only pending requests can be accepted.']);
            }

            $startTime = CarbonImmutable::instance($booking->scheduled_at)->setTimezone(config('app.timezone'));
            if ($error = $slots->availabilityError($repairerProfile->id, $startTime)) {
                throw ValidationException::withMessages(['scheduled_at' => $error]);
            }
            if ($slots->confirmedAtSameStart($repairerProfile->id, $startTime, $booking->id)) {
                throw ValidationException::withMessages(['scheduled_at' => 'This time is already booked.']);
            }

            $booking->update(['status' => 'confirmed']);
            $conversation = Conversation::firstOrCreate(
                ['booking_id' => $booking->id],
                ['sender_id' => $booking->customer_id, 'receiver_id' => $repairerProfile->user_id]
            );
            Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $repairerProfile->user_id,
                'content' => "Hello! I have accepted your request for {$booking->service_type}. I will see you on {$startTime->format('M d, h:i A')}."
            ]);
            $notifier->record($booking, $booking->customer_id, $repairerProfile->user_id, 'booking_approved', "booking_approved:{$booking->id}");

            return [$booking, $repairerProfile];
        });

        // 2. Sync to Google Calendar (Your existing code)
        $repairerUser = $repairerProfile->user;
        $customer = User::find($booking->customer_id);

        if ($repairerUser && $repairerUser->google_calendar_token) {
            $eventId = $this->addToGoogleCalendar($booking, $repairerUser, $customer);
            if ($eventId) {
                $booking->update(['google_event_id' => $eventId]);
            }
        }

        return redirect()->back()->with('message', 'Job Accepted, Chat Started & Synced!');
    }

    // 3. REJECT
    public function reject(Request $request, $id, NotificationRecorder $notifier)
    {
        DB::transaction(function () use ($id, $notifier) {
            [$booking, $profile] = $this->lockedOwnedBooking($id);
            if ($booking->status !== 'pending') {
                throw ValidationException::withMessages(['message' => 'Only pending requests can be declined.']);
            }
            $booking->update(['status' => 'rejected']);
            $notifier->record($booking, $booking->customer_id, $profile->user_id, 'booking_rejected', "booking_rejected:{$booking->id}");
        });

        return redirect()->back()->with('message', 'Request declined.');
    }

    // 4. Provider requests client confirmation of finished work.
    public function complete(Request $request, $id, NotificationRecorder $notifier)
    {
        DB::transaction(function () use ($id, $notifier) {
            [$booking, $profile] = $this->lockedOwnedBooking($id);
            if ($booking->status === 'completion_requested') {
                return;
            }
            if (!in_array($booking->status, ['confirmed', 'completion_disputed'], true)) {
                throw ValidationException::withMessages(['message' => 'Only confirmed or disputed work can be submitted for client confirmation.']);
            }

            $booking->update(['status' => 'completion_requested', 'completion_requested_at' => now()]);
            $conversation = Conversation::firstOrCreate(
                ['booking_id' => $booking->id],
                ['sender_id' => $booking->customer_id, 'receiver_id' => $profile->user_id]
            );
            $message = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $profile->user_id,
                'content' => 'The provider has finished the work. Please confirm completion in your booking details or report an issue.',
            ]);
            $notifier->record($booking, $booking->customer_id, $profile->user_id, 'completion_requested', "completion_requested:{$message->id}");
        });

        return redirect()->back()->with('message', 'Client confirmation requested. Payment is not yet recorded.');
    }

    private function lockedOwnedBooking($id): array
    {
        $profileId = Booking::findOrFail($id)->repairer_profile_id;
        // Lock the provider row first so approvals for different requests at one slot serialize.
        $profile = RepairerProfile::whereKey($profileId)->lockForUpdate()->firstOrFail();
        abort_unless($profile->user_id === Auth::id(), 403);
        $booking = Booking::whereKey($id)->lockForUpdate()->firstOrFail();

        return [$booking, $profile];
    }

    // --- HELPER: SYNC TO GOOGLE ---
    private function addToGoogleCalendar($booking, $repairerUser, $customer)
    {
        try {
            $client = new GoogleClient();
            $client->setClientId(config('services.google.client_id'));
            $client->setClientSecret(config('services.google.client_secret'));
            $client->setAccessToken($repairerUser->google_calendar_token);

            // A. Refresh Token Logic
            if ($client->isAccessTokenExpired()) {
                if (!$repairerUser->google_refresh_token) {
                    \Log::error('Google Sync Failed: Token expired and no refresh token.');
                    return null;
                }
                $newAccessToken = $client->fetchAccessTokenWithRefreshToken($repairerUser->google_refresh_token);

                if (isset($newAccessToken['error'])) {
                    \Log::error('Google Sync Failed: Error refreshing token.');
                    return null;
                }

                $repairerUser->update(['google_calendar_token' => $newAccessToken['access_token']]);
                $client->setAccessToken($newAccessToken['access_token']);
            }

            $service = new GoogleCalendar($client);

            // B. Date Formatting
            $startStr = \Carbon\Carbon::parse($booking->scheduled_at)->format('Y-m-d\TH:i:s');
            // If no end time stored, assume 1 hour
            $endTime = $booking->end_time
                ? \Carbon\Carbon::parse($booking->end_time)
                : \Carbon\Carbon::parse($booking->scheduled_at)->addHour();
            $endStr = $endTime->format('Y-m-d\TH:i:s');


            $locationString = $booking->location_snapshot ?: 'Service address unavailable';

            $event = new Event([
                'summary' => 'Repair Job: ' . $booking->service_type,
                'location' => $locationString,
                'description' => "Customer: {$customer->name}\nProblem: {$booking->problem_description}",
                'start' => [
                    'dateTime' => $startStr,
                    'timeZone' => 'Asia/Manila',
                ],
                'end' => [
                    'dateTime' => $endStr,
                    'timeZone' => 'Asia/Manila',
                ],
                'attendees' => [
                    ['email' => $customer->email],
                ],
                'reminders' => [
                    'useDefault' => FALSE,
                    'overrides' => [
                        ['method' => 'email', 'minutes' => 24 * 60],
                        ['method' => 'popup', 'minutes' => 30],
                    ],
                ],
            ]);


            $newEvent = $service->events->insert('primary', $event, ['sendUpdates' => 'all']);

            return $newEvent->id;
        } catch (\Exception $e) {
            \Log::error('Google Calendar Sync Exception: ' . $e->getMessage());
            return null;
        }
    }

    public function storeReview(Request $request, $id)
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:500',
        ]);

        try {
            $repairerUserId = DB::transaction(function () use ($request, $id, $validated) {
                $booking = Booking::with('repairerProfile')->lockForUpdate()->findOrFail($id);
                abort_unless($request->user()->user_id === $booking->customer_id, 403);
                if ($booking->status !== 'completed' || !$booking->client_accepted_at) {
                    throw ValidationException::withMessages(['message' => 'Only client-accepted work can be reviewed.']);
                }
                if (Review::where('booking_id', $booking->id)->exists()) {
                    throw ValidationException::withMessages(['message' => 'This job has already been reviewed.']);
                }

                Review::create([
                    'booking_id' => $booking->id,
                    'customer_id' => $request->user()->user_id,
                    'repairer_id' => $booking->repairerProfile->user_id,
                    'rating' => $validated['rating'],
                    'comment' => $validated['comment'] ?? null,
                ]);

                return $booking->repairerProfile->user_id;
            });
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages(['message' => 'This job has already been reviewed.']);
        }

        $newRating = $this->recalculateRating($repairerUserId);

        return redirect()->back()->with('success', "Review submitted! New Rating: {$newRating}");
    }

    /**
     * Helper to force-update the rating in the database
     */
    private function recalculateRating($repairerUserId)
    {
        // Calculate Average
        $newAverage = \App\Models\Review::where('repairer_id', $repairerUserId)->avg('rating');
        $finalRating = round($newAverage, 1);

        // NUCLEAR UPDATE: Direct SQL command
        \App\Models\RepairerProfile::where('user_id', $repairerUserId)
            ->update(['rating' => $finalRating]);

        return $finalRating;
    }
}
