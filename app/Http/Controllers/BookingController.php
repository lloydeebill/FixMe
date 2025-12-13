<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\User;
use App\Models\RepairerProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Google\Client as GoogleClient;
use Google\Service\Calendar as GoogleCalendar;
use Google\Service\Calendar\Event;
use Inertia\Inertia;
use App\Models\RepairerAvailability;

class BookingController extends Controller
{
    // 1. STORE (Customer Creates Request)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'repairer_id' => 'required|exists:repairer_profiles,repairer_id',
            'service_type' => 'required|string',
            'scheduled_at' => 'required|date|after:now',
            'problem_description' => 'nullable|string',
        ]);

        // Parse exactly what the user sent
        $startTime = \Carbon\Carbon::parse($validated['scheduled_at']);
        $endTime = $startTime->copy()->addHour();

        // Check for collisions
        $exactCollision = Booking::where('repairer_id', $validated['repairer_id'])
            ->where('scheduled_at', $startTime)
            ->where('status', 'confirmed')
            ->exists();

        $dayName = Carbon::parse($request->scheduled_at)->format('w'); // Get "Wednesday"

        $isAvailable = RepairerAvailability::where('repairer_profile_id', $request->repairer_id)

            ->where('day_of_week', $dayName)
            ->where('is_active', true)
            ->exists();

        if (!$isAvailable) {
            return back()->withErrors(['scheduled_at' => 'This repairer is not available on this day.']);
        }

        if ($exactCollision) {
            return back()->withErrors(['scheduled_at' => 'This time is already booked.']);
        }

        Booking::create([
            'customer_id' => Auth::id(),
            'repairer_id' => $validated['repairer_id'],
            'service_type' => $validated['service_type'],
            'scheduled_at' => $startTime,
            'end_time' => $endTime,
            'problem_description' => $validated['problem_description'] ?? null,
            'status' => 'pending',
        ]);

        return redirect()->back()->with('message', 'Request sent! Waiting for repairer confirmation.');
    }

    // 2. APPROVE (Repairer Accepts & Syncs)
    public function approve(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);

        $repairerProfile = RepairerProfile::where('repairer_id', $booking->repairer_id)->first();

        // Security Check
        if ($repairerProfile->user_id !== Auth::id() && Auth::user()->role !== 'admin') {
            abort(403, 'Unauthorized');
        }

        // 1. Update Status
        $booking->update(['status' => 'confirmed']);

        // 2. Sync to Google Calendar
        $repairerUser = $repairerProfile->user;
        $customer = User::find($booking->customer_id);

        if ($repairerUser && $repairerUser->google_calendar_token) {

            // Call the helper function below
            $eventId = $this->addToGoogleCalendar($booking, $repairerUser, $customer);

            if ($eventId) {
                $booking->update(['google_event_id' => $eventId]);
            }
        }

        return redirect()->back()->with('message', 'Job Accepted & Synced!');
    }

    // 3. REJECT
    public function reject(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);
        $repairerProfile = RepairerProfile::where('user_id', Auth::id())->first();

        if (!$repairerProfile || $booking->repairer_id !== $repairerProfile->repairer_id) {
            abort(403, 'Unauthorized');
        }

        $booking->update(['status' => 'rejected']);

        return redirect()->back()->with('message', 'Request declined.');
    }

    public function showBookingForm(User $repairer)
    {
        return Inertia::render('Customer/BookJob', [
            'repairer' => $repairer->load('repairerProfile.availabilities'),
            // This sends the Wed=Off, Thu=1pm-5pm rules to React
        ]);
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

            // B. THE FLOATING TIME FIX + TIMEZONE
            // 1. Get raw string (e.g. "2025-12-25T14:00:00")
            $startStr = \Carbon\Carbon::parse($booking->scheduled_at)->format('Y-m-d\TH:i:s');
            $endStr = \Carbon\Carbon::parse($booking->end_time)->format('Y-m-d\TH:i:s');

            $event = new Event([
                'summary' => 'Repair Job: ' . $booking->service_type,
                'location' => $customer->location ?? 'Customer Location',
                'description' => "Customer: {$customer->name}\nProblem: {$booking->problem_description}",
                'start' => [
                    'dateTime' => $startStr,
                    'timeZone' => 'Asia/Manila', //  REQUIRED: Tells Google where 14:00 is
                ],
                'end' => [
                    'dateTime' => $endStr,
                    'timeZone' => 'Asia/Manila', //  REQUIRED
                ],
                'attendees' => [
                    ['email' => $customer->email],
                ],
                'reminders' => [
                    'useDefault' => FALSE,
                    'overrides' => [
                        ['method' => 'email', 'minutes' => 24 * 60], // Email 1 day before
                        ['method' => 'popup', 'minutes' => 30],      // Popup 30 mins before
                    ],
                ],
            ]);

            $newEvent = $service->events->insert('primary', $event);
            return $newEvent->id;
        } catch (\Exception $e) {
            \Log::error('Google Calendar Sync Exception: ' . $e->getMessage());
            return null; // Fail gracefully
        }
    }
}
