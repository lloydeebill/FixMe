<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureOnboardingComplete;
use App\Models\Booking;
use App\Models\Location;
use App\Models\RepairerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BookingLocationAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(EnsureOnboardingComplete::class);
    }

    public function test_confirmed_booking_locations_are_visible_only_to_its_participants(): void
    {
        $clientLocation = Location::create(['address' => 'Test service address', 'latitude' => 14.55, 'longitude' => 121.02]);
        $providerLocation = Location::create(['address' => 'Test provider area', 'latitude' => 14.57, 'longitude' => 121.04]);
        $client = User::create(['name' => 'Test Client', 'email' => 'location-client@example.test', 'password' => 'password', 'location_id' => $clientLocation->id]);
        $provider = User::create(['name' => 'Test Provider', 'email' => 'location-provider@example.test', 'password' => 'password']);
        $other = User::create(['name' => 'Other', 'email' => 'location-other@example.test', 'password' => 'password']);
        $profile = RepairerProfile::create(['user_id' => $provider->user_id, 'business_name' => 'Test Fixer', 'location_id' => $providerLocation->id]);
        $booking = Booking::create(['customer_id' => $client->user_id, 'repairer_profile_id' => $profile->id, 'service_type' => 'Plumbing', 'scheduled_at' => now()->addDay(), 'status' => 'confirmed', 'location_snapshot' => 'Booked test address']);

        foreach ([$client, $provider] as $participant) {
            $this->actingAs($participant)->get("/bookings/{$booking->id}")->assertOk()->assertInertia(fn (Assert $page) => $page
                ->component('BookingDetails')
                ->where('serviceLocation.address', 'Booked test address')
                ->where('serviceLocation.latitude', null)
                ->where('serviceLocation.longitude', null)
                ->where('providerLocation.address', 'Test provider area')
                ->where('booking.location_snapshot', null)
                ->missing('booking.customer')
                ->etc());
        }

        $this->actingAs($other)->get("/bookings/{$booking->id}")->assertForbidden();
        $this->actingAs($provider)->get('/app')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->where('jobs.0.customer.name', 'Test Client')
            ->where('jobs.0.latitude', null)
            ->where('jobs.0.longitude', null)
            ->missing('jobs.0.customer.location')
            ->etc());

        $booking->update(['status' => 'completion_requested']);
        $this->get("/bookings/{$booking->id}")->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('serviceLocation.address', 'Booked test address')
            ->etc());
    }

    public function test_pending_job_pin_is_visible_to_client_and_assigned_provider_only_then_hidden_after_decline(): void
    {
        $account = Location::create(['address' => 'Private account location', 'latitude' => 14.55, 'longitude' => 121.02]);
        $providerPin = Location::create(['address' => 'Provider saved pin', 'latitude' => 8.96, 'longitude' => 125.55]);
        $client = User::create(['name' => 'Test Client', 'email' => 'pending-client@example.test', 'password' => 'password', 'location_id' => $account->id]);
        $provider = User::create(['name' => 'Test Provider', 'email' => 'pending-provider@example.test', 'password' => 'password']);
        $otherProvider = User::create(['name' => 'Other Provider', 'email' => 'other-provider@example.test', 'password' => 'password']);
        $otherClient = User::create(['name' => 'Other Client', 'email' => 'other-client@example.test', 'password' => 'password']);
        $profile = RepairerProfile::create(['user_id' => $provider->user_id, 'business_name' => 'Test Fixer', 'location_id' => $providerPin->id]);
        RepairerProfile::create(['user_id' => $otherProvider->user_id, 'business_name' => 'Other Fixer']);
        $booking = Booking::create(['customer_id' => $client->user_id, 'repairer_profile_id' => $profile->id, 'service_type' => 'Plumbing', 'scheduled_at' => now()->addDay(), 'status' => 'pending', 'location_snapshot' => 'Booked job address', 'job_latitude' => 8.95, 'job_longitude' => 125.54]);

        foreach ([$client, $provider] as $participant) {
            $this->actingAs($participant)->get("/bookings/{$booking->id}")->assertOk()->assertInertia(fn (Assert $page) => $page
                ->component('BookingDetails')
                ->where('serviceLocation.address', 'Booked job address')
                ->where('serviceLocation.latitude', 8.95)
                ->where('serviceLocation.longitude', 125.54)
                ->where('providerLocation.address', 'Provider saved pin')
                ->where('distanceKm', fn ($value) => $value > 0 && $value < 3)
                ->where('booking.location_snapshot', null)
                ->where('booking.job_latitude', null)
                ->missing('booking.customer')
                ->etc());
        }

        $this->actingAs($otherProvider)->get("/bookings/{$booking->id}")->assertForbidden();
        $this->actingAs($otherClient)->get("/bookings/{$booking->id}")->assertForbidden();
        $this->actingAs($otherProvider)->get('/app')->assertInertia(fn (Assert $page) => $page->missing('jobs.0')->etc());
        $this->actingAs($provider)->get('/app')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->where('jobs.0.customer.name', 'Test Client')
            ->where('jobs.0.service_location.address', 'Booked job address')
            ->where('jobs.0.service_location.latitude', 8.95)
            ->where('jobs.0.provider_location.address', 'Provider saved pin')
            ->where('jobs.0.distance_km', fn ($value) => $value > 0 && $value < 3)
            ->missing('jobs.0.customer.location')
            ->etc());

        $this->post("/bookings/{$booking->id}/reject")->assertRedirect();
        $this->get("/bookings/{$booking->id}")->assertInertia(fn (Assert $page) => $page
            ->where('serviceLocation', null)->where('distanceKm', null)
            ->where('booking.location_snapshot', null)->where('booking.job_latitude', null)->etc());
        $this->get('/app')->assertInertia(fn (Assert $page) => $page
            ->missing('jobs.0.service_location')->missing('jobs.0.distance_km')
            ->missing('jobs.0.latitude')->etc());
    }

    public function test_pending_missing_pins_keep_address_and_never_invent_distance_or_markers(): void
    {
        $client = User::factory()->create(['location_id' => Location::create(['address' => 'Unrelated account pin', 'latitude' => 8.8, 'longitude' => 125.4])->id]);
        $provider = User::factory()->create();
        $providerPin = Location::create(['address' => 'Provider area', 'latitude' => 8.96, 'longitude' => 125.55]);
        $profile = RepairerProfile::create(['user_id' => $provider->user_id, 'business_name' => 'Test Fixer', 'location_id' => $providerPin->id]);
        $historical = Booking::create(['customer_id' => $client->user_id, 'repairer_profile_id' => $profile->id, 'service_type' => 'Plumbing', 'scheduled_at' => now()->addDay(), 'status' => 'pending', 'location_snapshot' => 'Historical booked address']);
        $this->actingAs($provider)->get("/bookings/{$historical->id}")->assertInertia(fn (Assert $page) => $page
            ->where('serviceLocation.address', 'Historical booked address')
            ->where('serviceLocation.latitude', null)->where('serviceLocation.longitude', null)
            ->where('distanceKm', null)->where('providerLocation.latitude', 8.96)->etc());

        $profile->update(['location_id' => null]);
        $current = Booking::create(['customer_id' => $client->user_id, 'repairer_profile_id' => $profile->id, 'service_type' => 'Plumbing', 'scheduled_at' => now()->addDays(2), 'status' => 'pending', 'location_snapshot' => 'Pinned job', 'job_latitude' => 8.95, 'job_longitude' => 125.54]);
        $this->get("/bookings/{$current->id}")->assertInertia(fn (Assert $page) => $page
            ->where('serviceLocation.address', 'Pinned job')
            ->where('serviceLocation.latitude', 8.95)
            ->where('providerLocation.latitude', null)->where('distanceKm', null)->etc());
    }
}
