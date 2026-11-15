<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\User;
use Google\Client as GoogleClient;
use Google\Service\Calendar as GoogleCalendar;
use Google\Service\Calendar\Event;
use GuzzleHttp\Client as HttpClient;
use Illuminate\Support\Facades\Log;

class GoogleCalendarSync
{
    public function create(Booking $booking, User $provider, ?User $customer): ?string
    {
        if (! $provider->google_refresh_token || ! $customer?->email) {
            return null;
        }

        try {
            $client = new GoogleClient();
            $client->setClientId(config('services.google.client_id'));
            $client->setClientSecret(config('services.google.client_secret'));
            $client->setHttpClient(new HttpClient(['timeout' => 10, 'connect_timeout' => 3]));
            $token = $client->fetchAccessTokenWithRefreshToken($provider->google_refresh_token);
            if (empty($token['access_token']) || isset($token['error'])) {
                Log::warning('Google Calendar token refresh failed', ['booking_id' => $booking->id]);
                return null;
            }
            $provider->update(['google_calendar_token' => $token['access_token']]);
            $client->setAccessToken($token);

            $start = $booking->scheduled_at->timezone('Asia/Manila');
            $end = $booking->end_time?->timezone('Asia/Manila') ?? $start->copy()->addHour();
            $event = new Event([
                'summary' => 'Repair Job: '.$booking->service_type,
                'location' => $booking->location_snapshot ?: 'Service address unavailable',
                'description' => "Customer: {$customer->name}\nProblem: {$booking->problem_description}",
                'start' => ['dateTime' => $start->format('Y-m-d\TH:i:s'), 'timeZone' => 'Asia/Manila'],
                'end' => ['dateTime' => $end->format('Y-m-d\TH:i:s'), 'timeZone' => 'Asia/Manila'],
                'attendees' => [['email' => $customer->email]],
                'reminders' => [
                    'useDefault' => false,
                    'overrides' => [
                        ['method' => 'email', 'minutes' => 1440],
                        ['method' => 'popup', 'minutes' => 30],
                    ],
                ],
            ]);

            return (new GoogleCalendar($client))->events->insert('primary', $event, ['sendUpdates' => 'all'])->id;
        } catch (\Throwable $e) {
            // Google exceptions can contain response bodies or URLs. Never log their messages.
            Log::warning('Google Calendar sync failed', [
                'booking_id' => $booking->id,
                'exception' => $e::class,
            ]);
            return null;
        }
    }
}
