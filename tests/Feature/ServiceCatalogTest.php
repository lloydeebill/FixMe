<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureOnboardingComplete;
use App\Models\Booking;
use App\Models\RepairerProfile;
use App\Models\Skill;
use App\Models\User;
use Database\Seeders\SkillsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ServiceCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_reseeding_preserves_existing_skill_links_and_booking_text(): void
    {
        Skill::create(['name' => 'Aircon Services', 'slug' => 'aircon-services']);
        Skill::create(['name' => 'Gardening', 'slug' => 'gardening']);
        $customer = User::create(['name' => 'Client', 'email' => 'client@example.test', 'password' => 'password']);
        $provider = User::create(['name' => 'Provider', 'email' => 'provider@example.test', 'password' => 'password']);
        $profile = RepairerProfile::create(['user_id' => $provider->user_id, 'business_name' => 'Test Provider']);
        $aircon = Skill::where('slug', 'aircon-services')->firstOrFail();
        $gardening = Skill::where('slug', 'gardening')->firstOrFail();
        $profile->skills()->attach([$aircon->id, $gardening->id]);
        $booking = Booking::create([
            'customer_id' => $customer->user_id,
            'repairer_profile_id' => $profile->id,
            'service_type' => 'Aircon Services',
            'scheduled_at' => now()->addDay(),
            'status' => 'completed',
        ]);

        (new SkillsSeeder)->run();
        (new SkillsSeeder)->run();

        $this->assertSame(19, Skill::count());
        $this->assertSame(18, Skill::catalog()->count());
        $this->assertSame($aircon->id, Skill::where('slug', 'aircon-services')->firstOrFail()->id);
        $this->assertSame('Air Conditioning & Refrigeration', $aircon->fresh()->name);
        $this->assertTrue($profile->skills()->where('skills.id', $aircon->id)->exists());
        $this->assertTrue($profile->skills()->where('skills.id', $gardening->id)->exists());
        $this->assertFalse(Skill::where('slug', 'gardening')->firstOrFail()->is_active);
        $this->assertSame('Aircon Services', $booking->fresh()->service_type);
    }

    public function test_dashboard_and_provider_form_load_the_same_active_catalog(): void
    {
        (new SkillsSeeder)->run();
        $this->withoutMiddleware(EnsureOnboardingComplete::class);
        $customer = User::create(['name' => 'Client', 'email' => 'client@example.test', 'password' => 'password']);

        $this->actingAs($customer)->get('/app')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->has('serviceCategories', 18)
            ->where('serviceCategories.0.service_group', 'Home & Construction')
            ->where('serviceCategories.12.slug', 'event-setup-food-service')
            ->etc());

        $this->get('/become-repairer')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('RepairerRegister')
            ->has('availableSkills', 18)
            ->where('availableSkills.17.description', 'Professional driver services.')
            ->etc());
    }
}
