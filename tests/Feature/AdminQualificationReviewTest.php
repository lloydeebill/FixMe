<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureOnboardingComplete;
use App\Models\RepairerProfile;
use App\Models\TesdaQualification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminQualificationReviewTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(EnsureOnboardingComplete::class);
        Storage::fake('local');
    }

    private function submission(string $processing = 'screening_complete'): array
    {
        $provider = User::create(['name' => 'Provider', 'email' => 'provider@example.test', 'password' => 'password']);
        $other = User::create(['name' => 'Other', 'email' => 'other@example.test', 'password' => 'password']);
        $admin = User::create(['name' => 'Admin', 'email' => 'admin@example.test', 'password' => 'password', 'is_admin' => true]);
        $profile = RepairerProfile::create(['user_id' => $provider->user_id, 'business_name' => 'Example']);
        Storage::disk('local')->put('tesda-certificates/test.png', 'private-test-image');
        $qualification = TesdaQualification::create([
            'repairer_profile_id' => $profile->id,
            'image_path' => 'tesda-certificates/test.png',
            'image_mime' => 'image/png',
            'processing_status' => $processing,
            'verification_status' => 'pending',
            'extracted_details' => ['qualification_title' => 'Test title'],
        ]);

        return [$qualification, $provider, $other, $admin];
    }

    public function test_only_admin_can_list_view_private_image_and_record_review(): void
    {
        [$item, $provider, $other, $admin] = $this->submission();
        $path = "/admin/qualifications/{$item->id}";
        $this->get('/admin/qualifications')->assertRedirect('/login');
        $this->actingAs($provider)->get('/admin/qualifications')->assertForbidden();
        $this->get("{$path}/image")->assertForbidden();
        $this->post("{$path}/review", ['status' => 'registry_match', 'note' => 'Matched manually in registry.'])->assertForbidden();
        $this->actingAs($other)->get('/admin/qualifications')->assertForbidden();

        $this->actingAs($admin)->get('/admin/qualifications')->assertOk()->assertDontSee('tesda-certificates/test.png');
        Storage::disk('local')->assertExists($item->image_path);
        $image = $this->get("{$path}/image")->assertOk()->assertHeader('Content-Type', 'image/png');
        $this->assertStringContainsString('no-store', $image->headers->get('Cache-Control'));
        $this->post("{$path}/review", ['status' => 'registry_match', 'note' => 'Matched manually in registry.'])->assertRedirect();
        $this->assertDatabaseHas('tesda_qualifications', [
            'id' => $item->id, 'verification_status' => 'registry_match', 'reviewed_by' => $admin->user_id,
        ]);
        $this->assertNotNull($item->fresh()->reviewed_at);
        $this->actingAs($provider)->get('/provider/tesda-qualifications')->assertOk()->assertSee('Matched manually in registry.');
        $this->delete("/provider/tesda-qualifications/{$item->id}")->assertStatus(409);
        Storage::disk('local')->assertExists($item->image_path);
    }

    public function test_review_transitions_and_notes_are_validated(): void
    {
        [$item, , , $admin] = $this->submission();
        $url = "/admin/qualifications/{$item->id}/review";
        $this->actingAs($admin)->post($url, ['status' => 'officially_verified', 'note' => 'Invalid status'])->assertSessionHasErrors('status');
        $this->post($url, ['status' => 'registry_match', 'note' => 'x'])->assertSessionHasErrors('note');
        $this->post($url, ['status' => 'follow_up', 'note' => 'Expiry needs follow-up.'])->assertRedirect();
        $this->assertSame('follow_up', $item->fresh()->verification_status);
        $this->post($url, ['status' => 'follow_up', 'note' => 'Repeat follow-up.'])->assertSessionHasErrors('status');
        $this->post($url, ['status' => 'unconfirmed', 'note' => 'No match could be confirmed.'])->assertRedirect();
        $this->post($url, ['status' => 'registry_match', 'note' => 'Late match'])->assertSessionHasErrors('status');
        $this->assertSame('unconfirmed', $item->fresh()->verification_status);
    }

    public function test_ai_retry_cannot_reset_manual_review_or_auto_approve(): void
    {
        [$item, $provider, , $admin] = $this->submission('processing_failed');
        $this->actingAs($admin)->post("/admin/qualifications/{$item->id}/review", [
            'status' => 'follow_up', 'note' => 'Image requires follow-up.',
        ])->assertRedirect();
        config()->set('services.gemini.key', 'test-key');
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response([], 429)]);
        $this->actingAs($provider)->post("/provider/tesda-qualifications/{$item->id}/retry")->assertRedirect();
        $this->assertSame('follow_up', $item->fresh()->verification_status);
    }

    public function test_processing_submission_cannot_be_reviewed(): void
    {
        [$item, , , $admin] = $this->submission('processing');
        $this->actingAs($admin)->post("/admin/qualifications/{$item->id}/review", [
            'status' => 'registry_match', 'note' => 'Matched manually.',
        ])->assertSessionHasErrors('status');
        $this->assertSame('pending', $item->fresh()->verification_status);
    }
}
