<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureOnboardingComplete;
use App\Models\RepairerProfile;
use App\Models\TesdaQualification;
use App\Models\TesdaQualificationReview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminQualificationReviewTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(EnsureOnboardingComplete::class);
        $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class);
        Storage::fake('local');
    }

    private function submission(string $processing = 'screening_complete'): array
    {
        $provider = User::create(['name' => 'Provider', 'email' => 'provider@example.test', 'password' => 'password']);
        $other = User::create(['name' => 'Other', 'email' => 'other@example.test', 'password' => 'password']);
        $admin = User::create(['name' => 'Admin', 'email' => 'admin@example.test', 'password' => 'password']);
        $admin->forceFill(['is_admin' => true])->save();
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

    private function evidence(string $status, string $result, array $changes = []): array
    {
        return array_replace([
            'status' => $status,
            'note' => 'Manually checked the official registry page.',
            'registry_source' => '2017_onward',
            'registry_reference' => 'https://www.tesda.gov.ph/About/TESDA/31',
            'registry_checked_on' => now()->toDateString(),
            'registry_result' => $result,
        ], $changes);
    }

    public function test_only_admin_can_list_view_private_image_and_record_review(): void
    {
        [$item, $provider, $other, $admin] = $this->submission();
        $path = "/admin/qualifications/{$item->id}";
        $this->get('/admin/qualifications')->assertRedirect('/login');
        $this->actingAs($provider)->get('/admin/qualifications')->assertForbidden();
        $this->get("{$path}/image")->assertForbidden();
        $this->post("{$path}/review", $this->evidence('registry_match', 'match_found'))->assertForbidden();
        $this->actingAs($other)->get('/admin/qualifications')->assertForbidden();

        $this->actingAs($admin)->get('/admin/qualifications')->assertOk()->assertDontSee('tesda-certificates/test.png');
        Storage::disk('local')->assertExists($item->image_path);
        $image = $this->get("{$path}/image")->assertOk()->assertHeader('Content-Type', 'image/png');
        $this->assertStringContainsString('no-store', $image->headers->get('Cache-Control'));
        $this->post("{$path}/review", $this->evidence('registry_match', 'match_found', ['note' => 'Matched manually in registry.']))->assertRedirect();
        $this->assertDatabaseHas('tesda_qualifications', [
            'id' => $item->id, 'verification_status' => 'registry_match', 'reviewed_by' => $admin->user_id,
        ]);
        $this->assertNotNull($item->fresh()->reviewed_at);
        $this->assertSame('match_found', $item->fresh()->registry_result);
        $this->assertSame('2017_onward', $item->fresh()->registry_source);
        $this->assertSame('https://www.tesda.gov.ph/About/TESDA/31', $item->fresh()->registry_reference);
        $this->assertDatabaseHas('tesda_qualification_reviews', [
            'tesda_qualification_id' => $item->id, 'reviewer_id' => $admin->user_id,
            'outcome' => 'registry_match', 'registry_source' => '2017_onward',
            'registry_result' => 'match_found', 'review_note' => 'Matched manually in registry.',
        ]);
        $this->assertSame(1, TesdaQualificationReview::where('tesda_qualification_id', $item->id)->count());
        $this->actingAs($provider)->get('/provider/tesda-qualifications')->assertOk()->assertSee('Matched manually in registry.');
        $this->get('/provider/tesda-qualifications')->assertInertia(fn (Assert $page) => $page
            ->component('TesdaQualifications')->where('qualifications.0.registry_result', 'match_found')
            ->where('qualifications.0.registry_checked_on', now()->toDateString())->etc());
        $this->delete("/provider/tesda-qualifications/{$item->id}")->assertStatus(409);
        Storage::disk('local')->assertExists($item->image_path);
    }

    public function test_review_transitions_and_notes_are_validated(): void
    {
        [$item, , , $admin] = $this->submission();
        $url = "/admin/qualifications/{$item->id}/review";
        $this->actingAs($admin)->post($url, $this->evidence('officially_verified', 'match_found'))->assertSessionHasErrors('status');
        $this->post($url, $this->evidence('registry_match', 'match_found', ['note' => 'x']))->assertSessionHasErrors('note');
        $this->post($url, $this->evidence('registry_match', 'no_match'))->assertSessionHasErrors('registry_result');
        $this->post($url, $this->evidence('registry_match', 'match_found', ['registry_result' => null]))->assertSessionHasErrors('registry_result');
        $this->post($url, $this->evidence('registry_match', 'match_found', ['registry_reference' => 'https://example.com/registry']))->assertSessionHasErrors('registry_reference');
        $this->post($url, $this->evidence('registry_match', 'match_found', ['registry_reference' => 'https://www.tesda.gov.ph/']))->assertSessionHasErrors('registry_reference');
        $this->post($url, $this->evidence('registry_match', 'match_found', ['registry_checked_on' => now()->addDay()->toDateString()]))->assertSessionHasErrors('registry_checked_on');
        $this->post($url, $this->evidence('follow_up', 'expired', ['note' => 'Expiry needs follow-up.']))->assertRedirect();
        $this->assertSame('follow_up', $item->fresh()->verification_status);
        $this->post($url, $this->evidence('follow_up', 'expired', ['note' => 'Repeat follow-up.']))->assertSessionHasErrors('status');
        $this->post($url, $this->evidence('unconfirmed', 'no_match', ['note' => 'No match could be confirmed.']))->assertRedirect();
        $this->post($url, $this->evidence('registry_match', 'match_found', ['note' => 'Late match']))->assertSessionHasErrors('status');
        $this->assertSame('unconfirmed', $item->fresh()->verification_status);
        $history = TesdaQualificationReview::where('tesda_qualification_id', $item->id)->orderBy('id')->get();
        $this->assertCount(2, $history);
        $this->assertSame('follow_up', $history[0]->outcome);
        $this->assertSame('expired', $history[0]->registry_result);
        $this->assertSame('Expiry needs follow-up.', $history[0]->review_note);
        $this->assertSame('unconfirmed', $history[1]->outcome);
        $this->assertSame('No match could be confirmed.', $history[1]->review_note);
        $this->actingAs($admin)->get('/admin/qualifications')->assertInertia(fn (Assert $page) => $page
            ->component('AdminQualifications')->has('qualifications.data.0.review_history', 2)
            ->where('qualifications.data.0.review_history.0.outcome', 'unconfirmed')
            ->where('qualifications.data.0.review_history.1.outcome', 'follow_up')->etc());
        $this->actingAs($item->repairerProfile->user)->get('/provider/tesda-qualifications')
            ->assertDontSee('Expiry needs follow-up.')
            ->assertSee('No match could be confirmed.');
    }

    public function test_failed_history_insert_rolls_back_current_review_fields(): void
    {
        [$item, , , $admin] = $this->submission();
        DB::statement("CREATE TRIGGER reject_review_history BEFORE INSERT ON tesda_qualification_reviews BEGIN SELECT RAISE(ABORT, 'test history failure'); END");
        $this->withoutExceptionHandling();
        try {
            $this->actingAs($admin)->post("/admin/qualifications/{$item->id}/review", $this->evidence('registry_match', 'match_found'));
            $this->fail('A failed history insert must fail the review transaction.');
        } catch (QueryException) {
            $this->assertSame('pending', $item->fresh()->verification_status);
            $this->assertNull($item->fresh()->reviewed_at);
            $this->assertNull($item->fresh()->registry_result);
            $this->assertDatabaseCount('tesda_qualification_reviews', 0);
        }
    }

    public function test_history_has_no_public_write_routes_and_reviewed_qualification_cannot_be_deleted(): void
    {
        [$item, $provider, $other, $admin] = $this->submission();
        $this->actingAs($admin)->post("/admin/qualifications/{$item->id}/review", $this->evidence('registry_match', 'match_found'))->assertRedirect();
        $historyId = TesdaQualificationReview::firstOrFail()->id;
        foreach ([$provider, $other, $admin] as $user) {
            $this->actingAs($user)->post("/admin/qualifications/{$item->id}/history", [])->assertNotFound();
            $this->put("/admin/qualifications/{$item->id}/history/{$historyId}", [])->assertNotFound();
            $this->delete("/admin/qualifications/{$item->id}/history/{$historyId}")->assertNotFound();
        }
        $this->actingAs($provider)->delete("/provider/tesda-qualifications/{$item->id}")->assertStatus(409);
        $this->assertDatabaseCount('tesda_qualification_reviews', 1);
    }

    public function test_ai_retry_cannot_reset_manual_review_or_auto_approve(): void
    {
        [$item, $provider, , $admin] = $this->submission('processing_failed');
        $this->actingAs($admin)->post("/admin/qualifications/{$item->id}/review", $this->evidence('follow_up', 'needs_follow_up', ['note' => 'Image requires follow-up.']))->assertRedirect();
        config()->set('services.gemini.key', 'test-key');
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response([], 429)]);
        $this->actingAs($provider)->post("/provider/tesda-qualifications/{$item->id}/retry")->assertRedirect();
        $this->assertSame('follow_up', $item->fresh()->verification_status);
    }

    public function test_processing_submission_cannot_be_reviewed(): void
    {
        [$item, , , $admin] = $this->submission('processing');
        $this->actingAs($admin)->post("/admin/qualifications/{$item->id}/review", $this->evidence('registry_match', 'match_found', ['note' => 'Matched manually.']))->assertSessionHasErrors('status');
        $this->assertSame('pending', $item->fresh()->verification_status);
    }

    public function test_admin_queue_paginates_all_submissions_and_rejects_non_admin_pages(): void
    {
        [$first, $provider, , $admin] = $this->submission();
        $profile = $first->repairerProfile;
        for ($index = 0; $index < 45; $index++) {
            $profile->tesdaQualifications()->create([
                'image_path' => 'tesda-certificates/test.png', 'image_mime' => 'image/png',
                'processing_status' => 'screening_complete',
            ]);
        }

        $this->actingAs($provider)->get('/admin/qualifications?page=2')->assertForbidden();
        $this->actingAs($admin)->get('/admin/qualifications')->assertInertia(fn (Assert $page) => $page
            ->component('AdminQualifications')->has('qualifications.data', 20)
            ->where('qualifications.total', 46)->where('qualifications.current_page', 1)
            ->where('qualifications.data.0.id', 46)->etc());
        $this->get('/admin/qualifications?page=3')->assertInertia(fn (Assert $page) => $page
            ->component('AdminQualifications')->has('qualifications.data', 6)
            ->where('qualifications.total', 46)->where('qualifications.current_page', 3)
            ->where('qualifications.data.0.id', 6)->where('qualifications.data.5.id', 1)->etc());
    }
}
