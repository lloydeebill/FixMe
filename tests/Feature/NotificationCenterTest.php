<?php

namespace Tests\Feature;

use App\Events\NewMessage;
use App\Http\Middleware\EnsureOnboardingComplete;
use App\Models\Booking;
use App\Models\RepairerAvailability;
use App\Models\RepairerProfile;
use App\Models\Skill;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\NotificationRecorder;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NotificationCenterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(EnsureOnboardingComplete::class);
        Event::fake([NewMessage::class]);
    }

    private function people(): array
    {
        $client = User::factory()->create();
        $provider = User::factory()->create();
        $other = User::factory()->create();
        $profile = RepairerProfile::create(['user_id' => $provider->user_id, 'business_name' => 'Test Provider', 'service_areas' => ['butuan-city']]);
        $skill = Skill::create(['name' => 'Plumbing', 'slug' => 'plumbing', 'service_group' => 'Home & Construction', 'is_active' => true]);
        $profile->skills()->attach($skill->id);
        $start = CarbonImmutable::now('Asia/Manila')->addDays(3)->setTime(10, 0);
        RepairerAvailability::create([
            'repairer_profile_id' => $profile->id,
            'day_of_week' => $start->dayOfWeek,
            'start_time' => '09:00',
            'end_time' => '17:00',
            'is_active' => true,
        ]);
        return [$client, $provider, $other, $profile, $start];
    }

    public function test_booking_request_and_decision_notify_only_the_other_participant_and_open_safely(): void
    {
        [$client, $provider, $other, $profile, $start] = $this->people();
        $this->actingAs($client)->post('/bookings', [
            'repairer_profile_id' => $profile->id,
            'service_type' => 'Plumbing',
            'scheduled_at' => $start->format('Y-m-d H:i'),
            'problem_description' => 'Test kitchen tap leak',
            'service_area' => 'butuan-city',
            'job_address' => 'Test job address',
            'job_latitude' => 8.95,
            'job_longitude' => 125.54,
        ])->assertRedirect()->assertSessionHas('message', 'Request sent! Waiting for repairer confirmation.');
        $booking = Booking::firstOrFail();
        $requestNotice = UserNotification::firstOrFail();
        $this->assertSame($provider->user_id, $requestNotice->user_id);
        $this->assertSame('booking_requested', $requestNotice->type);
        $this->assertDatabaseMissing('user_notifications', ['user_id' => $client->user_id]);

        $this->actingAs($other)->post("/notifications/{$requestNotice->id}/open")->assertForbidden();
        $this->actingAs($client)->post("/notifications/{$requestNotice->id}/open")->assertForbidden();
        $this->assertNull($requestNotice->fresh()->read_at);

        $this->actingAs($provider)->get('/app')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->where('unreadNotificationsCount', 1)
            ->where('notifications.0.job_description', 'Test kitchen tap leak')
            ->where('jobCounts.pending', 1)
            ->where('jobCounts.active', 0)
            ->etc());
        $this->post("/notifications/{$requestNotice->id}/open", ['mode' => 'provider'])
            ->assertRedirect(route('dashboard', ['tab' => 'jobs', 'job' => 'pending', 'booking' => $booking->id, 'from' => 'notifications', 'mode' => 'provider']));
        $this->post("/notifications/{$requestNotice->id}/open")->assertRedirect();
        $this->assertNotNull($requestNotice->fresh()->read_at);
        $this->get('/app')->assertInertia(fn (Assert $page) => $page->where('unreadNotificationsCount', 0)->etc());
        $this->actingAs($other)->get('/app')->assertInertia(fn (Assert $page) => $page->missing('notifications.0')->etc());

        $this->actingAs($provider)->post("/bookings/{$booking->id}/approve")->assertRedirect()->assertSessionHas('message', 'Job Accepted, Chat Started & Synced!');
        $this->post("/bookings/{$booking->id}/approve")->assertSessionHasErrors();
        $this->assertDatabaseCount('user_notifications', 2);
        $this->assertDatabaseHas('user_notifications', ['user_id' => $client->user_id, 'type' => 'booking_approved']);
        $this->get('/app')->assertInertia(fn (Assert $page) => $page
            ->where('jobCounts.pending', 0)
            ->where('jobCounts.active', 1)
            ->etc());
    }

    public function test_new_message_notification_is_recipient_specific_unique_and_opens_chat(): void
    {
        [$client, $provider, $other, $profile, $start] = $this->people();
        $booking = Booking::create(['customer_id' => $client->user_id, 'repairer_profile_id' => $profile->id, 'service_type' => 'Plumbing', 'scheduled_at' => $start, 'status' => 'confirmed']);

        $response = $this->actingAs($client)->postJson("/api/messages/{$booking->id}", ['message' => 'Test message'])->assertCreated();
        $messageId = $response->json('message.id');
        $notice = UserNotification::firstOrFail();
        $this->assertSame('new_message', $notice->type);
        $this->assertSame($provider->user_id, $notice->user_id);
        $this->assertSame($messageId, $notice->message_id);
        app(NotificationRecorder::class)->record($booking, $provider->user_id, $client->user_id, 'new_message', "message:{$messageId}");
        $this->assertDatabaseCount('user_notifications', 1);
        $this->actingAs($other)->post("/notifications/{$notice->id}/open")->assertForbidden();
        $this->actingAs($provider)->post("/notifications/{$notice->id}/open", ['mode' => 'provider'])
            ->assertRedirect(route('chat.test', ['bookingId' => $booking->id, 'from' => 'notifications', 'mode' => 'provider']));
        $this->assertNotNull($notice->fresh()->read_at);
        $this->assertFalse((bool) $notice->fresh()->booking->conversation->messages->first()->is_read);
    }

    public function test_rejected_booking_notifies_client_once_and_opens_booking_details(): void
    {
        [$client, $provider, , $profile, $start] = $this->people();
        $booking = Booking::create(['customer_id' => $client->user_id, 'repairer_profile_id' => $profile->id, 'service_type' => 'Plumbing', 'scheduled_at' => $start, 'status' => 'pending']);

        $this->actingAs($provider)->post("/bookings/{$booking->id}/reject")->assertRedirect();
        $this->post("/bookings/{$booking->id}/reject")->assertSessionHasErrors();
        $notice = UserNotification::firstOrFail();
        $this->assertDatabaseCount('user_notifications', 1);
        $this->assertSame($client->user_id, $notice->user_id);
        $this->assertSame('booking_rejected', $notice->type);
        $this->actingAs($client)->post("/notifications/{$notice->id}/open", ['mode' => 'client'])
            ->assertRedirect(route('bookings.show', ['id' => $booking->id, 'from' => 'notifications', 'mode' => 'client']));
    }

    public function test_completion_and_payment_transitions_notify_once_per_actual_action(): void
    {
        [$client, $provider, , $profile, $start] = $this->people();
        $booking = Booking::create(['customer_id' => $client->user_id, 'repairer_profile_id' => $profile->id, 'service_type' => 'Plumbing', 'scheduled_at' => $start, 'status' => 'confirmed']);
        $url = "/bookings/{$booking->id}";

        $this->actingAs($provider)->post("$url/complete")->assertRedirect();
        $this->post("$url/complete")->assertRedirect();
        $this->assertSame(1, UserNotification::where('type', 'completion_requested')->count());
        $this->actingAs($client)->post("$url/report-issue", ['reason' => 'Issue remains'])->assertRedirect();
        $this->post("$url/report-issue", ['reason' => 'Issue remains'])->assertRedirect();
        $this->assertSame(1, UserNotification::where('type', 'completion_disputed')->count());
        $this->actingAs($provider)->post("$url/complete")->assertRedirect();
        $this->assertSame(2, UserNotification::where('type', 'completion_requested')->count());
        $this->actingAs($client)->post("$url/accept-completion")->assertRedirect();
        $this->post("$url/accept-completion")->assertRedirect();
        $this->assertSame(1, UserNotification::where('type', 'completion_accepted')->count());
        $this->post("$url/payment-method", ['payment_method' => 'cash'])->assertRedirect();
        $this->post("$url/report-payment")->assertRedirect();
        $this->post("$url/report-payment")->assertRedirect();
        $this->assertSame(1, UserNotification::where('type', 'payment_declared')->count());
        $this->actingAs($provider)->post("$url/confirm-payment")->assertRedirect();
        $this->post("$url/confirm-payment")->assertRedirect();
        $this->assertSame(1, UserNotification::where('type', 'payment_confirmed')->count());
        $this->assertDatabaseMissing('user_notifications', ['user_id' => $provider->user_id, 'type' => 'payment_confirmed']);
        $this->get('/app')->assertInertia(fn (Assert $page) => $page
            ->where('jobCounts.active', 0)
            ->where('jobCounts.completed', 1)
            ->etc());
    }

    public function test_job_counts_follow_existing_status_groups_and_skip_rejected_or_cancelled(): void
    {
        [$client, $provider, , $profile, $start] = $this->people();
        foreach (['pending', 'confirmed', 'in_progress', 'completion_requested', 'completion_disputed', 'completed', 'rejected', 'cancelled'] as $status) {
            Booking::create(['customer_id' => $client->user_id, 'repairer_profile_id' => $profile->id, 'service_type' => 'Plumbing', 'scheduled_at' => $start, 'status' => $status]);
        }
        $this->actingAs($provider)->get('/app')->assertInertia(fn (Assert $page) => $page
            ->where('jobCounts.pending', 1)
            ->where('jobCounts.active', 4)
            ->where('jobCounts.completed', 1)
            ->etc());
        $this->assertDatabaseCount('user_notifications', 0);
    }

    public function test_each_booking_update_opens_only_its_participants_booking_details(): void
    {
        [$client, $provider, $other, $profile, $start] = $this->people();
        $booking = Booking::create(['customer_id' => $client->user_id, 'repairer_profile_id' => $profile->id, 'service_type' => 'Plumbing', 'scheduled_at' => $start, 'status' => 'confirmed', 'problem_description' => 'Private job notes']);
        $types = [
            'booking_approved' => $client,
            'booking_rejected' => $client,
            'completion_requested' => $client,
            'completion_disputed' => $provider,
            'completion_accepted' => $provider,
            'payment_declared' => $provider,
            'payment_confirmed' => $client,
        ];
        foreach ($types as $type => $recipient) {
            $notice = UserNotification::create(['user_id' => $recipient->user_id, 'booking_id' => $booking->id, 'type' => $type, 'event_key' => "test:{$type}"]);
            $this->actingAs($other)->post("/notifications/{$notice->id}/open")->assertForbidden();
            $this->assertNull($notice->fresh()->read_at);
            $mode = $recipient->user_id === $client->user_id ? 'client' : 'provider';
            $this->actingAs($recipient)->post("/notifications/{$notice->id}/open", ['mode' => $mode])
                ->assertRedirect(route('bookings.show', ['id' => $booking->id, 'from' => 'notifications', 'mode' => $mode]));
            $this->assertNotNull($notice->fresh()->read_at);
        }
        $this->actingAs($client)->get('/app')->assertInertia(fn (Assert $page) => $page->where('notifications.0.job_description', null)->etc());
    }
}
