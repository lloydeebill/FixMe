<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureOnboardingComplete;
use App\Models\RepairerProfile;
use App\Models\TesdaQualification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TesdaQualificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(EnsureOnboardingComplete::class);
        $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class);
        Storage::fake('local');
        config()->set('services.gemini.key', 'test-key');
        config()->set('services.gemini.certificate_model', 'gemini-2.5-flash');
    }

    private function provider(string $name = 'Alex Example'): User
    {
        $user = User::create(['name' => $name, 'email' => uniqid().'@example.test', 'password' => 'test-password']);
        RepairerProfile::create(['user_id' => $user->user_id, 'business_name' => 'Example Services']);
        return $user;
    }

    private function extraction(array $changes = []): array
    {
        return array_replace([
            'document_type' => 'NC', 'holder_name' => 'Alex Example', 'certificate_number' => 'ABC123',
            'qualification_title' => 'Plumbing NC II', 'nc_level' => 'II', 'issue_date' => '2024-01-01',
            'expiry_date' => null, 'issuing_office' => null, 'readability_issues' => [],
            'missing_fields' => [], 'visible_inconsistencies' => [],
        ], $changes);
    }

    private function fakeGemini(array|string $body): void
    {
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [['content' => ['parts' => [['text' => is_string($body) ? $body : json_encode($body)]]]]],
        ])]);
    }

    private function upload(): void
    {
        $this->post('/provider/tesda-qualifications', [
            'certificate' => UploadedFile::fake()->image('sample.png'), 'consent' => '1',
        ])->assertRedirect('/provider/tesda-qualifications');
    }

    public function test_successful_screening_stays_pending_and_image_is_private(): void
    {
        $this->actingAs($this->provider());
        $this->fakeGemini($this->extraction());
        $this->upload();
        $record = TesdaQualification::firstOrFail();
        $this->assertSame('screening_complete', $record->processing_status, $record->failure_reason ?? 'none');
        $this->assertSame('pending', $record->verification_status);
        $this->assertSame('ABC123', $record->extracted_details['certificate_number']);
        Storage::disk('local')->assertExists($record->image_path);
        $this->get("/provider/tesda-qualifications/{$record->id}/image")->assertOk()->assertHeader('Content-Type', 'image/png');
        $this->assertStringNotContainsString($record->image_path, $record->toJson());
    }

    public function test_provider_ownership_is_enforced_for_every_record_action(): void
    {
        $this->actingAs($this->provider());
        $this->fakeGemini($this->extraction());
        $this->upload();
        $record = TesdaQualification::firstOrFail();
        $other = $this->provider('Other Person');
        $this->actingAs($other);
        $this->get("/provider/tesda-qualifications/{$record->id}/image")->assertNotFound();
        $this->post("/provider/tesda-qualifications/{$record->id}/retry")->assertNotFound();
        $this->delete("/provider/tesda-qualifications/{$record->id}")->assertNotFound();
        $this->assertDatabaseHas('tesda_qualifications', ['id' => $record->id]);
    }

    public function test_upload_requires_provider_consent_and_real_image_within_limit(): void
    {
        $customer = User::create(['name' => 'Customer', 'email' => 'customer@example.test', 'password' => 'test-password']);
        $this->actingAs($customer)->get('/provider/tesda-qualifications')->assertNotFound();
        $this->actingAs($this->provider());
        $this->post('/provider/tesda-qualifications', ['certificate' => UploadedFile::fake()->image('sample.png')])->assertSessionHasErrors('consent');
        $this->post('/provider/tesda-qualifications', ['certificate' => UploadedFile::fake()->create('not-image.jpg', 2, 'text/plain'), 'consent' => '1'])->assertSessionHasErrors('certificate');
        $this->post('/provider/tesda-qualifications', ['certificate' => UploadedFile::fake()->image('sample.png')->size(5121), 'consent' => '1'])->assertSessionHasErrors('certificate');
        $this->assertDatabaseCount('tesda_qualifications', 0);
    }

    public function test_unclear_and_malformed_responses_are_handled(): void
    {
        $this->actingAs($this->provider());
        $first = $this->extraction(['document_type' => 'uncertain', 'holder_name' => null, 'readability_issues' => ['Image is blurry']]);
        Http::fakeSequence()->push(['candidates' => [['content' => ['parts' => [['text' => json_encode($first)]]]]]])->push(['candidates' => [['content' => ['parts' => [['text' => 'not valid json']]]]]]);
        $this->upload();
        $this->assertSame('needs_clarification', TesdaQualification::first()->processing_status);
        $this->upload();
        $this->assertSame('processing_failed', TesdaQualification::latest('id')->first()->processing_status);
    }

    public function test_api_failure_can_retry_and_deletion_removes_private_image(): void
    {
        $this->actingAs($this->provider());
        $second = $this->extraction();
        Http::fakeSequence()->push([], 429)->push(['candidates' => [['content' => ['parts' => [['text' => json_encode($second)]]]]]]);
        $this->upload();
        $record = TesdaQualification::firstOrFail();
        $this->assertSame('processing_failed', $record->fresh()->processing_status);
        $this->post("/provider/tesda-qualifications/{$record->id}/retry")->assertRedirect();
        $this->assertSame('screening_complete', $record->fresh()->processing_status);
        $this->post("/provider/tesda-qualifications/{$record->id}/retry")->assertStatus(409);
        $path = $record->image_path;
        $this->delete("/provider/tesda-qualifications/{$record->id}")->assertRedirect();
        Storage::disk('local')->assertMissing($path);
        $this->assertDatabaseCount('tesda_qualifications', 0);
    }

    public function test_name_and_expiry_checks_request_clarification_without_verification(): void
    {
        $this->actingAs($this->provider());
        $this->fakeGemini($this->extraction(['holder_name' => 'Different Name', 'expiry_date' => '2020-01-01']));
        $this->upload();
        $record = TesdaQualification::firstOrFail();
        $this->assertSame('needs_clarification', $record->processing_status);
        $this->assertSame('pending', $record->verification_status);
        $this->assertCount(2, $record->issues);
    }
}


