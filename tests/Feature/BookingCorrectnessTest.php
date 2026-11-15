<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureOnboardingComplete;
use App\Models\Booking;
use App\Models\RepairerAvailability;
use App\Models\RepairerProfile;
use App\Models\Skill;
use App\Models\Review;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingCorrectnessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(EnsureOnboardingComplete::class);
    }

    private function setupBooking(): array
    {
        $client = User::create(['name' => 'Client', 'email' => 'client@example.test', 'password' => 'password']);
        $provider = User::create(['name' => 'Provider', 'email' => 'provider@example.test', 'password' => 'password']);
        $other = User::create(['name' => 'Other', 'email' => 'other@example.test', 'password' => 'password']);
        $profile = RepairerProfile::create(['user_id' => $provider->user_id, 'business_name' => 'Example Provider', 'service_areas' => ['butuan-city']]);
        $skill = Skill::create(['name' => 'Plumbing', 'slug' => 'plumbing', 'service_group' => 'Home & Construction', 'is_active' => true]);
        $profile->skills()->attach($skill->id);
        $start = CarbonImmutable::now('Asia/Manila')->addDays(3)->setTime(10, 0, 0);
        $schedule = RepairerAvailability::create([
            'repairer_profile_id' => $profile->id,
            'day_of_week' => $start->dayOfWeek,
            'start_time' => '09:00',
            'end_time' => '17:00',
            'is_active' => true,
        ]);

        return [$client, $provider, $other, $profile, $start, $schedule];
    }

    private function requestBooking(RepairerProfile $profile, CarbonImmutable $start): array
    {
        return [
            'repairer_profile_id' => $profile->id,
            'service_type' => 'Plumbing',
            'scheduled_at' => $start->format('Y-m-d H:i'),
            'problem_description' => 'Test request',
            'service_area' => 'butuan-city',
            'job_address' => 'Test job address',
            'job_latitude' => 8.95,
            'job_longitude' => 125.54,
        ];
    }

    public function test_valid_booking_is_saved_in_manila_time_and_out_of_hours_is_rejected(): void
    {
        [$client, , , $profile, $start, $schedule] = $this->setupBooking();
        $this->actingAs($client);

        $this->post('/bookings', $this->requestBooking($profile, $start))->assertRedirect();
        $this->assertDatabaseHas('bookings', [
            'repairer_profile_id' => $profile->id,
            'scheduled_at' => $start->format('Y-m-d H:i:s'),
            'status' => 'pending',
        ]);
        $this->post('/bookings', $this->requestBooking($profile, $start->setTime(8, 0)))->assertSessionHasErrors('scheduled_at');
        $this->post('/bookings', $this->requestBooking($profile, $start->setTime(17, 0)))->assertSessionHasErrors('scheduled_at');
        $schedule->delete();
        $this->post('/bookings', $this->requestBooking($profile, $start->setTime(11, 0)))->assertSessionHasErrors('scheduled_at');
        $this->assertDatabaseCount('bookings', 1);
    }

    public function test_approval_rechecks_hours_and_identical_confirmed_slots(): void
    {
        [$client, $provider, , $profile, $start, $schedule] = $this->setupBooking();
        $this->actingAs($client);
        $this->post('/bookings', $this->requestBooking($profile, $start));
        $this->post('/bookings', $this->requestBooking($profile, $start));
        [$first, $second] = Booking::orderBy('id')->get()->all();

        $this->actingAs($provider)->post("/bookings/{$first->id}/approve")->assertRedirect();
        $this->assertSame('confirmed', $first->fresh()->status);
        $this->post("/bookings/{$second->id}/approve")->assertSessionHasErrors('scheduled_at');
        $this->assertSame('pending', $second->fresh()->status);

        $schedule->update(['is_active' => false]);
        $this->post("/bookings/{$second->id}/approve")->assertSessionHasErrors('scheduled_at');
        $this->assertSame('pending', $second->fresh()->status);
    }

    public function test_approval_rejects_a_slot_after_working_hours_change(): void
    {
        [$client, $provider, , $profile, $start, $schedule] = $this->setupBooking();
        $this->actingAs($client)->post('/bookings', $this->requestBooking($profile, $start));
        $booking = Booking::firstOrFail();

        $schedule->update(['start_time' => '11:00']);
        $this->actingAs($provider)->post("/bookings/{$booking->id}/approve")->assertSessionHasErrors('scheduled_at');
        $this->assertSame('pending', $booking->fresh()->status);
    }

    public function test_rejected_request_does_not_reserve_the_slot(): void
    {
        [$client, $provider, , $profile, $start] = $this->setupBooking();
        $this->actingAs($client);
        $this->post('/bookings', $this->requestBooking($profile, $start));
        $this->post('/bookings', $this->requestBooking($profile, $start));
        [$first, $second] = Booking::orderBy('id')->get()->all();

        $this->actingAs($provider)->post("/bookings/{$first->id}/reject")->assertRedirect();
        $this->post("/bookings/{$second->id}/approve")->assertRedirect();
        $this->assertSame('rejected', $first->fresh()->status);
        $this->assertSame('confirmed', $second->fresh()->status);
    }

    public function test_cancelled_request_does_not_reserve_the_slot(): void
    {
        [$client, $provider, , $profile, $start] = $this->setupBooking();
        Booking::create([
            'customer_id' => $client->user_id,
            'repairer_profile_id' => $profile->id,
            'service_type' => 'Plumbing',
            'scheduled_at' => $start,
            'status' => 'cancelled',
        ]);

        $this->actingAs($client)->post('/bookings', $this->requestBooking($profile, $start))->assertRedirect();
        $pending = Booking::where('status', 'pending')->firstOrFail();
        $this->actingAs($provider)->post("/bookings/{$pending->id}/approve")->assertRedirect();
        $this->assertSame('confirmed', $pending->fresh()->status);
    }

    public function test_only_owner_can_make_valid_booking_transitions(): void
    {
        [$client, $provider, $other, $profile, $start] = $this->setupBooking();
        $this->actingAs($client)->post('/bookings', $this->requestBooking($profile, $start));
        $booking = Booking::firstOrFail();

        $this->post("/bookings/{$booking->id}/approve")->assertForbidden();
        $this->actingAs($other)->post("/bookings/{$booking->id}/reject")->assertForbidden();
        $this->post("/bookings/{$booking->id}/complete")->assertForbidden();
        $this->actingAs($provider)->post("/bookings/{$booking->id}/complete")->assertSessionHasErrors('message');
        $this->post("/bookings/{$booking->id}/approve")->assertRedirect();
        $this->post("/bookings/{$booking->id}/approve")->assertSessionHasErrors('message');
        $this->post("/bookings/{$booking->id}/reject")->assertSessionHasErrors('message');
        $this->post("/bookings/{$booking->id}/complete")->assertRedirect();
        $this->post("/bookings/{$booking->id}/complete")->assertRedirect();
        $this->assertSame('completion_requested', $booking->fresh()->status);
    }

    public function test_only_client_can_review_a_completed_booking_once(): void
    {
        [$client, $provider, $other, $profile, $start] = $this->setupBooking();
        $this->actingAs($client)->post('/bookings', $this->requestBooking($profile, $start));
        $booking = Booking::firstOrFail();

        $this->post("/bookings/{$booking->id}/review", ['rating' => 5, 'comment' => 'Good work'])->assertSessionHasErrors('message');
        $this->actingAs($other)->post("/bookings/{$booking->id}/review", ['rating' => 5])->assertForbidden();
        $this->actingAs($provider)->post("/bookings/{$booking->id}/approve");
        $this->post("/bookings/{$booking->id}/complete");
        $this->actingAs($client)->post("/bookings/{$booking->id}/accept-completion")->assertRedirect();

        $this->actingAs($client)->post("/bookings/{$booking->id}/review", ['rating' => 6])->assertSessionHasErrors('rating');
        $this->post("/bookings/{$booking->id}/review", ['rating' => 5, 'comment' => str_repeat('a', 501)])->assertSessionHasErrors('comment');
        $this->post("/bookings/{$booking->id}/review", ['rating' => 5, 'comment' => 'Good work'])->assertRedirect();
        $this->post("/bookings/{$booking->id}/review", ['rating' => 4])->assertSessionHasErrors('message');
        $this->assertDatabaseCount('reviews', 1);
        $this->assertSame(5.0, (float) $profile->fresh()->rating);
    }

    public function test_database_rejects_duplicate_review_for_same_booking(): void
    {
        [$client, $provider, , $profile, $start] = $this->setupBooking();
        $booking = Booking::create([
            'customer_id' => $client->user_id,
            'repairer_profile_id' => $profile->id,
            'service_type' => 'Plumbing',
            'scheduled_at' => $start,
            'status' => 'completed',
        ]);
        $review = ['booking_id' => $booking->id, 'customer_id' => $client->user_id, 'repairer_id' => $provider->user_id, 'rating' => 5];
        Review::create($review);

        $this->expectException(UniqueConstraintViolationException::class);
        Review::create($review);
    }
}
