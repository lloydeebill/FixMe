<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureOnboardingComplete;
use App\Models\Booking;
use App\Models\RepairerAvailability;
use App\Models\RepairerProfile;
use App\Models\User;
use App\Services\GoogleCalendarSync;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GoogleCalendarSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(EnsureOnboardingComplete::class);
    }

    private function booking(): array
    {
        $client = User::create(['name' => 'Client', 'email' => 'client@example.test', 'password' => 'password']);
        $provider = User::create(['name' => 'Provider', 'email' => 'provider@example.test', 'password' => 'password']);
        $other = User::create(['name' => 'Other', 'email' => 'other@example.test', 'password' => 'password']);
        $profile = RepairerProfile::create(['user_id' => $provider->user_id, 'business_name' => 'Example']);
        $start = CarbonImmutable::now('Asia/Manila')->addDays(3)->setTime(10, 0);
        RepairerAvailability::create([
            'repairer_profile_id' => $profile->id,
            'day_of_week' => $start->dayOfWeek,
            'start_time' => '09:00',
            'end_time' => '17:00',
            'is_active' => true,
        ]);
        $booking = Booking::create([
            'customer_id' => $client->user_id,
            'repairer_profile_id' => $profile->id,
            'service_type' => 'Plumbing',
            'scheduled_at' => $start,
            'status' => 'pending',
        ]);

        return [$booking, $provider, $client, $other];
    }

    public function test_acceptance_without_calendar_consent_keeps_booking_and_explains_missing_sync(): void
    {
        [$booking, $provider] = $this->booking();
        $this->mock(GoogleCalendarSync::class)->shouldNotReceive('create');

        $this->actingAs($provider)->post("/bookings/{$booking->id}/approve")
            ->assertRedirect()->assertSessionHas('error');
        $this->assertSame('confirmed', $booking->fresh()->status);
        $this->assertNull($booking->fresh()->google_event_id);
    }

    public function test_calendar_failure_does_not_undo_acceptance_and_can_be_retried_once(): void
    {
        [$booking, $provider, $client, $other] = $this->booking();
        $provider->update(['google_refresh_token' => 'test-refresh']);
        $calendar = $this->mock(GoogleCalendarSync::class);
        $calendar->shouldReceive('create')->once()->andReturn(null);

        $this->actingAs($provider)->post("/bookings/{$booking->id}/approve")
            ->assertRedirect()->assertSessionHas('error');
        $this->assertSame('confirmed', $booking->fresh()->status);
        $this->assertNull($booking->fresh()->google_event_id);

        $this->actingAs($client)->post("/bookings/{$booking->id}/sync-calendar")->assertForbidden();
        $this->actingAs($other)->post("/bookings/{$booking->id}/sync-calendar")->assertForbidden();

        $calendar->shouldReceive('create')->once()->andReturn('test-event-id');
        $this->actingAs($provider)->post("/bookings/{$booking->id}/sync-calendar")
            ->assertRedirect()->assertSessionHas('message');
        $this->assertSame('test-event-id', $booking->fresh()->google_event_id);
        $this->post("/bookings/{$booking->id}/sync-calendar")->assertRedirect();
        $this->assertSame('test-event-id', $booking->fresh()->google_event_id);
    }

    public function test_calendar_retry_rejects_pending_booking(): void
    {
        [$booking, $provider] = $this->booking();
        $this->actingAs($provider)->post("/bookings/{$booking->id}/sync-calendar")
            ->assertSessionHasErrors('message');
    }
}
