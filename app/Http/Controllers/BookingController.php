<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\User;
use App\Models\RepairerProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Google\Client as GoogleClient;
use Google\Service\Calendar as GoogleCalendar;
use Google\Service\Calendar\Event;
use Inertia\Inertia;
use App\Models\RepairerAvailability;
use App\Models\Conversation;
use App\Models\Message;

class BookingController extends Controller
{

    // 0. LIST (Get My Bookings)
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Booking::query();

        // Filter: Am I the Customer or the Repairer?
        if ($user->role === 'client') {
            $query->where('customer_id', $user->user_id);
        } elseif ($user->role === 'repairer') {
            // Ensure we get bookings for this repairer's profile
            $profile = RepairerProfile::where('user_id', $user->user_id)->first();
            if ($profile) {
                $query->where('repairer_profile_id', $profile->id);
            }
        }

        // Use the Scopes we added to Booking.php earlier
        // 'with' loads the relationships so you can show names/photos
        $active  = (clone $query)->active()->with(['repairerProfile', 'customer'])->get();
        $history = (clone $query)->completed()->with(['repairerProfile', 'customer'])->get();

        return response()->json([
            'active_jobs' => $active,
            'history'     => $history,
        ]);
    }
    // 1. STORE (Customer Creates Request)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'repairer_profile_id' => 'required|exists:repairer_profiles,id',
            'service_type'        => 'required|string',
            'scheduled_at'        => 'required|date|after:now',
            'problem_description' => 'nullable|string',
        ], [
            'scheduled_at.after' => 'You cannot book a time in the past.',
        ]);

        $targetProfile = RepairerProfile::findOrFail($validated['repairer_profile_id']);

        if ($targetProfile->user_id === Auth::id()) {
            return back()->withErrors([
                'message' => 'You cannot book your own services! Switch to Repairer Mode.'
            ]);
        }

        // Parse Time
        $startTime = \Carbon\Carbon::parse($validated['scheduled_at']);
        $endTime = $startTime->copy()->addHour(); // Default 1 hour duration

        // Check Availability
        $dayIndex = (int) $startTime->format('w');
        $hasSetSchedule = RepairerAvailability::where('repairer_profile_id', $targetProfile->id)->exists();

        if ($hasSetSchedule) {
            $isAvailable = RepairerAvailability::where('repairer_profile_id', $targetProfile->id)
                ->where('day_of_week', $dayIndex)
                ->where('is_active', true)
                ->exists();

            if (!$isAvailable) {
                $dayName = $startTime->format('l');
                return back()->withErrors(['scheduled_at' => "This repairer is not available on {$dayName}s."]);
            }
        }

        // Check for double booking
        $exactCollision = Booking::where('repairer_profile_id', $targetProfile->id)
            ->where('scheduled_at', $startTime)
            ->where('status', 'confirmed')
            ->exists();

        if ($exactCollision) {
            return back()->withErrors(['scheduled_at' => 'This time is already booked.']);
        }

        // Create Booking
        Booking::create([
            'customer_id'         => Auth::id(),
            'repairer_profile_id' => $validated['repairer_profile_id'],
            'service_type'        => $validated['service_type'],
            'scheduled_at'        => $validated['scheduled_at'],
            'status'              => 'pending',
            'problem_description' => $validated['problem_description'],
        ]);

        return redirect()->back()->with('message', 'Request sent! Waiting for repairer confirmation.');
    }

    // 2. APPROVE (Repairer Accepts & Syncs)
    // 2. APPROVE (Repairer Accepts & Syncs)
    public function approve(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);
        $repairerProfile = RepairerProfile::find($booking->repairer_profile_id);

        if (!$repairerProfile) {
            abort(404, 'Profile not found');
        }

        if ($repairerProfile->user_id !== Auth::id() && Auth::user()->role !== 'admin') {
            abort(403, 'Unauthorized');
        }

        // 1. Update Status
        $booking->update(['status' => 'confirmed']);

        // 👇 FIX: CREATE THE CONVERSATION FIRST!
        $conversation = Conversation::firstOrCreate(
            ['booking_id' => $booking->id],
            [
                'sender_id' => $booking->customer_id,
                'receiver_id' => $repairerProfile->user_id
            ]
        );

        // 👇 NOW you can use $conversation->id
        $formattedDate = \Carbon\Carbon::parse($booking->scheduled_at)->format('M d, h:i A');

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $repairerProfile->user_id, // Sent by Repairer
            'content'         => "Hello! I have accepted your request for {$booking->service_type}. I will see you on {$formattedDate}."
        ]);

        // 2. Sync to Google Calendar (Your existing code)
        $repairerUser = $repairerProfile->user;
        $customer = User::with('location')->find($booking->customer_id);

        if ($repairerUser && $repairerUser->google_calendar_token) {
            $eventId = $this->addToGoogleCalendar($booking, $repairerUser, $customer);
            if ($eventId) {
                $booking->update(['google_event_id' => $eventId]);
            }
        }

        return redirect()->back()->with('message', 'Job Accepted, Chat Started & Synced!');
    }

    // 3. REJECT
    public function reject(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);

        // Find the profile belonging to the logged-in user
        $repairerProfile = RepairerProfile::where('user_id', Auth::id())->first();

        // Validate ownership
        if (!$repairerProfile || $booking->repairer_profile_id !== $repairerProfile->id) {
            abort(403, 'Unauthorized');
        }

        $booking->update(['status' => 'rejected']);

        return redirect()->back()->with('message', 'Request declined.');
    }

    // 4. COMPLETE (Repairer Marks Job as Done)
    public function complete(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);

        // Security Check: Only the assigned Repairer can mark it done
        $repairerProfile = RepairerProfile::where('user_id', Auth::id())->first();

        if (!$repairerProfile || $booking->repairer_profile_id !== $repairerProfile->id) {
            abort(403, 'Only the repairer can complete this job.');
        }

        if ($booking->status !== 'confirmed') {
            return back()->withErrors(['message' => 'Job must be in progress to complete it.']);
        }

        $booking->update(['status' => 'completed']);

        // Optional: Send a "Job Done" message to the chat automatically
        if ($booking->conversation) {
            Message::create([
                'conversation_id' => $booking->conversation->id,
                'sender_id'       => Auth::id(),
                'content'         => "I have marked this job as completed. Thank you!"
            ]);
        }

        return redirect()->back()->with('message', 'Job marked as complete!');
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

            // 🛑 FIX: Handle Location Object vs String
            // We migrated to a 'locations' table, so $customer->location is an OBJECT now.
            // Google expects a STRING.
            $locationString = 'Customer Location';
            if ($customer->location) {
                $locationString = $customer->location->address; // 👈 Extract the address string
            }

            $event = new Event([
                'summary' => 'Repair Job: ' . $booking->service_type,
                'location' => $locationString, // 👈 Passing the string, not the object
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

            // 🛑 CRITICAL FIX: 'sendUpdates' => 'all'
            // This forces Google to send the email invite to the customer
            $newEvent = $service->events->insert('primary', $event, ['sendUpdates' => 'all']);

            return $newEvent->id;
        } catch (\Exception $e) {
            \Log::error('Google Calendar Sync Exception: ' . $e->getMessage());
            return null;
        }
    }
}
