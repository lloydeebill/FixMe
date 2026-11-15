<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureOnboardingComplete;
use App\Models\Booking;
use App\Models\Location;
use App\Models\RepairerAvailability;
use App\Models\RepairerProfile;
use App\Models\Skill;
use App\Models\TesdaQualification;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProviderRankingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(EnsureOnboardingComplete::class);
    }

    private function provider(string $name, Skill $skill, array $areas, ?array $pin): RepairerProfile
    {
        $user = User::factory()->create(['name' => $name]);
        $location = $pin ? Location::create(['address' => "{$name} service pin", 'latitude' => $pin[0], 'longitude' => $pin[1]]) : null;
        $profile = RepairerProfile::create(['user_id' => $user->user_id, 'business_name' => $name, 'location_id' => $location?->id, 'service_areas' => $areas]);
        $profile->skills()->attach($skill->id);
        return $profile;
    }

    public function test_category_area_distance_availability_fallback_and_pending_certificate(): void
    {
        $client = User::factory()->create();
        $plumbing = Skill::create(['name' => 'Plumbing', 'slug' => 'plumbing', 'service_group' => 'Home & Construction', 'is_active' => true]);
        $cleaning = Skill::create(['name' => 'Cleaning', 'slug' => 'cleaning', 'service_group' => 'Home & Construction', 'is_active' => true]);
        $near = $this->provider('Near', $plumbing, ['butuan-city', 'buenavista'], [8.951, 125.541]);
        $far = $this->provider('Far', $plumbing, ['butuan-city'], [9.05, 125.60]);
        $missing = $this->provider('Missing pin', $plumbing, ['butuan-city'], null);
        $missingFirst = $this->provider('A missing pin', $plumbing, ['butuan-city'], null);
        $this->provider('Wrong service', $cleaning, ['butuan-city'], [8.95, 125.54]);
        $this->provider('Wrong area', $plumbing, ['cabadbaran-city'], [8.95, 125.54]);
        $time = CarbonImmutable::now('Asia/Manila')->addDays(3)->setTime(10, 0);
        RepairerAvailability::create(['repairer_profile_id' => $near->id, 'day_of_week' => $time->dayOfWeek, 'start_time' => '09:00', 'end_time' => '17:00', 'is_active' => true]);
        RepairerAvailability::create(['repairer_profile_id' => $missing->id, 'day_of_week' => $time->dayOfWeek, 'start_time' => '09:00', 'end_time' => '17:00', 'is_active' => true]);

        $query = ['category' => 'plumbing', 'area' => 'butuan-city', 'latitude' => 8.95, 'longitude' => 125.54, 'scheduled_at' => $time->format('Y-m-d H:i')];
        $this->getJson('/provider-suggestions?'.http_build_query($query))->assertUnauthorized();
        $result = $this->actingAs($client)->getJson('/provider-suggestions?'.http_build_query($query))->assertOk()->json('providers');
        $this->assertSame([$near->id, $far->id, $missing->id, $missingFirst->id], array_column(array_column($result, 'repairer_profile'), 'id'));
        $this->assertSame('available', $result[0]['suggestion']['availability']);
        $this->assertSame('unavailable', $result[1]['suggestion']['availability']);
        $this->assertGreaterThan(0, $result[1]['suggestion']['distance_km']);
        $this->assertNull($result[2]['suggestion']['distance_km']);
        $this->assertGreaterThan($result[1]['suggestion']['score'], $result[0]['suggestion']['score']);
        $this->assertEqualsWithDelta(60 * max(0, 1 - $result[0]['suggestion']['distance_km'] / 50) + 40, $result[0]['suggestion']['score'], 0.2);

        TesdaQualification::create(['repairer_profile_id' => $far->id, 'image_path' => 'test-only', 'image_mime' => 'image/png', 'verification_status' => 'pending']);
        $afterCertificate = $this->getJson('/provider-suggestions?'.http_build_query($query))->assertOk()->json('providers');
        $this->assertSame(array_column($result, 'suggestion'), array_column($afterCertificate, 'suggestion'));

        $this->getJson('/provider-suggestions?'.http_build_query(['category' => 'plumbing', 'area' => 'buenavista']))->assertOk()
            ->assertJsonCount(1, 'providers')->assertJsonPath('providers.0.repairer_profile.id', $near->id)
            ->assertJsonPath('providers.0.suggestion.distance_km', null)
            ->assertJsonPath('providers.0.suggestion.availability', 'not_checked');
        $withoutTime = $this->getJson('/provider-suggestions?'.http_build_query(['category' => 'plumbing', 'area' => 'butuan-city', 'latitude' => 8.95, 'longitude' => 125.54]))->assertOk()->json('providers');
        $this->assertSame('not_checked', $withoutTime[0]['suggestion']['availability']);
        $this->assertLessThanOrEqual(60, $withoutTime[0]['suggestion']['score']);
        $this->assertSame([$missingFirst->id, $missing->id], array_slice(array_column(array_column($withoutTime, 'repairer_profile'), 'id'), -2));
        $this->getJson('/provider-suggestions?'.http_build_query(['category' => 'cleaning', 'area' => 'buenavista']))->assertOk()->assertJsonCount(0, 'providers');
        $this->getJson('/provider-suggestions?'.http_build_query(['category' => 'plumbing', 'area' => 'elsewhere']))->assertUnprocessable();

        Booking::create(['customer_id' => $client->user_id, 'repairer_profile_id' => $near->id, 'service_type' => 'Plumbing', 'scheduled_at' => $time, 'status' => 'confirmed']);
        $this->getJson('/provider-suggestions?'.http_build_query($query))->assertOk()->assertJsonPath('providers.0.suggestion.availability', 'unavailable');
    }

    public function test_booking_keeps_the_chosen_job_location_separate_from_account_location(): void
    {
        $account = Location::create(['address' => 'Old account location', 'latitude' => 8.8, 'longitude' => 125.4]);
        $client = User::factory()->create(['location_id' => $account->id]);
        $other = User::factory()->create();
        $skill = Skill::create(['name' => 'Plumbing', 'slug' => 'plumbing', 'service_group' => 'Home & Construction', 'is_active' => true]);
        $provider = $this->provider('Pilot provider', $skill, ['butuan-city'], [8.951, 125.541]);
        $time = CarbonImmutable::now('Asia/Manila')->addDays(3)->setTime(10, 0);
        RepairerAvailability::create(['repairer_profile_id' => $provider->id, 'day_of_week' => $time->dayOfWeek, 'start_time' => '09:00', 'end_time' => '17:00', 'is_active' => true]);
        $payload = ['repairer_profile_id' => $provider->id, 'service_type' => 'Plumbing', 'scheduled_at' => $time->format('Y-m-d H:i'), 'service_area' => 'butuan-city', 'job_address' => 'Chosen job landmark', 'job_latitude' => 8.95, 'job_longitude' => 125.54];
        $this->actingAs($client)->post('/bookings', array_diff_key($payload, ['job_latitude' => true, 'job_longitude' => true]))->assertSessionHasErrors(['job_latitude', 'job_longitude']);
        $this->post('/bookings', [...$payload, 'service_area' => 'buenavista'])->assertSessionHasErrors('service_area');
        $this->post('/bookings', [...$payload, 'service_type' => 'Electrical'])->assertSessionHasErrors('service_type');
        $this->assertDatabaseCount('bookings', 0);
        $this->actingAs($client)->post('/bookings', $payload)->assertRedirect();
        $booking = Booking::firstOrFail();
        $this->assertSame('Chosen job landmark', $booking->location_snapshot);
        $this->assertSame('butuan-city', $booking->service_area);
        $this->actingAs($other)->get("/bookings/{$booking->id}")->assertForbidden();
        $this->actingAs($client)->get("/bookings/{$booking->id}")->assertOk()->assertSee('Chosen job landmark')->assertDontSee('Old account location');
        $this->actingAs($provider->user)->post("/bookings/{$booking->id}/approve")->assertRedirect();
        $this->get("/bookings/{$booking->id}")->assertOk()->assertSee('Chosen job landmark')->assertSee('8.95');
        $this->actingAs($other)->get("/bookings/{$booking->id}")->assertForbidden();
    }

    public function test_a_real_provider_account_can_save_multiple_served_areas_during_registration(): void
    {
        $skill = Skill::create(['name' => 'Plumbing', 'slug' => 'plumbing', 'service_group' => 'Home & Construction', 'is_active' => true]);
        $user = User::factory()->create();
        $this->actingAs($user)->post('/become-repairer', [
            'business_name' => 'Pilot provider', 'bio' => '', 'skills' => [$skill->id],
            'service_areas' => ['butuan-city', 'cabadbaran-city'],
            'location' => 'Saved service pin', 'latitude' => 8.95, 'longitude' => 125.54,
        ])->assertRedirect(route('dashboard'));
        $this->assertSame(['butuan-city', 'cabadbaran-city'], $user->fresh()->repairerProfile->service_areas);
        $this->assertSame('Saved service pin', $user->fresh()->repairerProfile->location->address);
    }
}
