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

class BookingController extends Controller
{
    public function store(Request $request)
    {
        // 1. Validate
        $validated = $request->validate([
            'repairer_id' => 'required|exists:repairer_profiles,repairer_id',
            'service_type' => 'required|string',
            'scheduled_at' => 'required|date',
            'problem_description' => 'nullable|string',
        ]);

        $customer = Auth::user();

        // 2. Calculate End Time
        $startTime = Carbon::parse($validated['scheduled_at']);
        $endTime = $startTime->copy()->addHour();

        // 3. Create the Booking (Status: Pending)
        Booking::create([
            'customer_id' => $customer->user_id,
            'repairer_id' => $validated['repairer_id'],
            'service_type' => $validated['service_type'],
            'scheduled_at' => $startTime,
            'end_time' => $endTime,
            'problem_description' => $validated['problem_description'] ?? null,
            'status' => 'pending', // Waiting for approval
        ]);

        // 4. Return success immediately (No Google Sync yet)
        return redirect()->back()->with('message', 'Booking requested! Waiting for repairer approval.');
    }

    public function approve(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);

        // --- SECURITY FIX ---
        // Find the profile associated with this booking
        $repairerProfile = RepairerProfile::where('repairer_id', $booking->repairer_id)->first();

        // Check: Is the logged-in user the owner of this profile?
        if ($repairerProfile->user_id !== Auth::id() && Auth::user()->role !== 'admin') {
            abort(403, 'Unauthorized: You are not the repairer for this booking.');
        }

        // Update Status
        $booking->update(['status' => 'confirmed']);

        // --- GOOGLE SYNC LOGIC ---
        $repairerUser = $repairerProfile->user;
        $customer = User::find($booking->customer_id); // Assuming customer_id links to users table

        if ($repairerUser && $repairerUser->google_calendar_token) {
            $eventId = $this->addToGoogleCalendar($booking, $repairerUser, $customer);

            if ($eventId) {
                $booking->update(['google_event_id' => $eventId]);
            }
        }

        return redirect()->back()->with('message', 'Booking confirmed and synced to Google!');
    }

    // --- HELPER FUNCTION ---
    private function addToGoogleCalendar($booking, $repairerUser, $customer)
    {
        try {
            $client = new GoogleClient();
            $client->setClientId(config('services.google.client_id'));
            $client->setClientSecret(config('services.google.client_secret'));
            $client->setAccessToken($repairerUser->google_calendar_token);

            // 1. REFRESH TOKEN LOGIC
            if ($client->isAccessTokenExpired()) {
                if (!$repairerUser->google_refresh_token) {
                    \Log::error('Google Sync Failed: No refresh token for User ' . $repairerUser->id);
                    return null;
                }

                $newAccessToken = $client->fetchAccessTokenWithRefreshToken($repairerUser->google_refresh_token);

                if (isset($newAccessToken['error'])) {
                    \Log::error('Google Sync Failed: ' . json_encode($newAccessToken));
                    return null;
                }

                $repairerUser->update([
                    'google_calendar_token' => $newAccessToken['access_token']
                ]);

                $client->setAccessToken($newAccessToken);
            }

            // 2. CREATE EVENT
            $service = new GoogleCalendar($client);

            $event = new Event([
                'summary' => 'Repair Job: ' . $booking->service_type,
                'location' => $customer->location ?? 'Customer Location',
                'description' => "Customer: {$customer->name}\nProblem: {$booking->problem_description}",
                'start' => [
                    'dateTime' => Carbon::parse($booking->scheduled_at)->toRfc3339String(),
                    'timeZone' => 'Asia/Manila',
                ],
                'end' => [
                    'dateTime' => Carbon::parse($booking->end_time)->toRfc3339String(),
                    'timeZone' => 'Asia/Manila',
                ],
            ]);

            $newEvent = $service->events->insert('primary', $event);
            return $newEvent->id;
        } catch (\Exception $e) {
            \Log::error('Google Calendar Sync Failed: ' . $e->getMessage());
            return null;
        }
    }
}
