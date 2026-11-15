<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureOnboardingComplete;
use App\Models\Location;
use App\Models\RepairerProfile;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AccountProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(EnsureOnboardingComplete::class);
    }

    public function test_client_updates_own_name_and_account_location_without_changing_provider_service_pin(): void
    {
        $shared = Location::create(['address' => 'Original', 'latitude' => 14.5, 'longitude' => 121.0]);
        $user = User::factory()->create(['location_id' => $shared->id]);
        $profile = RepairerProfile::create(['user_id' => $user->user_id, 'business_name' => 'Provider', 'location_id' => $shared->id]);

        $this->actingAs($user)->put('/settings/profile', ['name' => 'Updated Client', 'location' => 'New account area', 'latitude' => 14.6, 'longitude' => 121.1])->assertRedirect();

        $this->assertSame('Updated Client', $user->fresh()->name);
        $this->assertSame('New account area', $user->fresh()->location->address);
        $this->assertSame('Original', $profile->fresh()->location->address);
    }

    public function test_only_a_provider_can_edit_own_service_profile_and_location(): void
    {
        $skill = Skill::create(['name' => 'Plumbing', 'slug' => 'plumbing', 'is_active' => true]);
        $provider = User::factory()->create();
        $profile = RepairerProfile::create(['user_id' => $provider->user_id, 'business_name' => 'Before']);
        $other = User::factory()->create();
        $payload = ['business_name' => 'After', 'bio' => 'Test bio', 'skills' => [$skill->id], 'service_areas' => ['butuan-city', 'buenavista'], 'location' => 'Service area', 'latitude' => 14.5, 'longitude' => 121.0];

        $this->actingAs($other)->put('/settings/provider-profile', $payload)->assertForbidden();
        $this->assertSame('Before', $profile->fresh()->business_name);
        $this->actingAs($provider)->put('/settings/provider-profile', $payload)->assertRedirect();
        $this->assertSame('After', $profile->fresh()->business_name);
        $this->assertSame('Service area', $profile->fresh()->location->address);
        $this->assertTrue($profile->skills()->where('skills.id', $skill->id)->exists());
        $this->assertSame(['butuan-city', 'buenavista'], $profile->fresh()->service_areas);
    }

    public function test_profile_edits_require_authentication_and_valid_location_coordinates(): void
    {
        $user = User::factory()->create();
        $this->put('/settings/profile', ['name' => 'Updated', 'location' => 'Test'])->assertRedirect('/login');
        $this->actingAs($user)->put('/settings/profile', ['name' => 'Updated', 'location' => 'Test', 'latitude' => 91, 'longitude' => 121])->assertSessionHasErrors('latitude');
        $this->assertNotSame('Updated', $user->fresh()->name);
    }

    public function test_provider_profile_edit_preserves_an_existing_retired_service_link(): void
    {
        $retired = Skill::create(['name' => 'Old service', 'slug' => 'old-service', 'is_active' => false]);
        $provider = User::factory()->create();
        $profile = RepairerProfile::create(['user_id' => $provider->user_id, 'business_name' => 'Before']);
        $profile->skills()->attach($retired->id);

        $this->actingAs($provider)->put('/settings/provider-profile', [
            'business_name' => 'After', 'bio' => '', 'skills' => [$retired->id],
            'service_areas' => ['butuan-city'],
            'location' => 'Service area', 'latitude' => 14.5, 'longitude' => 121.0,
        ])->assertRedirect();

        $this->assertTrue($profile->skills()->where('skills.id', $retired->id)->exists());
    }

    public function test_settings_loads_only_the_signed_in_users_profile_and_saved_locations(): void
    {
        $own = User::factory()->create(['location_id' => Location::create(['address' => 'Own account area'])->id]);
        $profile = RepairerProfile::create(['user_id' => $own->user_id, 'business_name' => 'Own service', 'location_id' => Location::create(['address' => 'Own service area'])->id]);
        $other = User::factory()->create(['location_id' => Location::create(['address' => 'Other private area'])->id]);
        RepairerProfile::create(['user_id' => $other->user_id, 'business_name' => 'Other service']);

        $this->actingAs($own)->get('/settings?section=provider-profile')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Settings')
            ->where('accountLocation.address', 'Own account area')
            ->where('providerProfile.id', $profile->id)
            ->where('providerProfile.location.address', 'Own service area')
            ->missing('providerProfile.user')
            ->etc());
    }
}
