<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureOnboardingComplete;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class AiAccessAndSerializationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(EnsureOnboardingComplete::class);
        config()->set('services.gemini.key', 'test-key');
        Cache::flush();
    }

    private function user(): User
    {
        return User::create(['name' => 'Example', 'email' => 'example@example.test', 'password' => 'password']);
    }

    public function test_unauthenticated_users_cannot_call_either_ai_helper(): void
    {
        Http::fake();

        $this->postJson('/api/scan-problem', ['image' => 'example'])->assertUnauthorized();
        $this->postJson('/api/plan-project', ['project' => 'Repair a sink'])->assertUnauthorized();
        Http::assertNothingSent();
    }

    public function test_ai_helper_requests_are_throttled(): void
    {
        $this->actingAs($this->user());
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response(['candidates' => []])]);

        for ($attempt = 0; $attempt < 10; $attempt++) {
            $this->postJson('/api/plan-project', ['project' => 'Repair a sink'])->assertOk();
        }

        $this->postJson('/api/plan-project', ['project' => 'Repair a sink'])->assertStatus(429);
        Http::assertSentCount(10);
    }

    public function test_missing_configured_key_returns_503_without_an_upstream_request(): void
    {
        $this->actingAs($this->user());
        config()->set('services.gemini.key', null);
        Http::fake();

        $this->postJson('/api/plan-project', ['project' => 'Repair a sink'])
            ->assertStatus(503)->assertExactJson(['error' => 'AI service is temporarily unavailable.']);
        Http::assertNothingSent();
    }

    public function test_upstream_failure_returns_and_logs_only_safe_details(): void
    {
        $this->actingAs($this->user());
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response(['secret_upstream_body' => 'sensitive example'], 500)]);
        Log::shouldReceive('warning')->once()->with('Gemini request failed.', [
            'model' => 'gemini-3.1-flash-lite', 'status' => 500,
        ]);
        Log::shouldReceive('info')->never();

        $this->postJson('/api/plan-project', ['project' => 'Repair a sink'])
            ->assertStatus(502)
            ->assertExactJson(['error' => 'AI service is temporarily unavailable.'])
            ->assertDontSee('secret_upstream_body');
    }

    public function test_mocked_gemini_result_keeps_ai_text_without_provider_or_catalog_claims(): void
    {
        $this->actingAs($this->user());
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [['content' => ['parts' => [['text' => 'NEED AN EXPERT? A plumber can inspect the pipe.']]]]],
        ])]);

        $this->postJson('/api/plan-project', ['project' => 'Repair a sink'])
            ->assertOk()
            ->assertJsonPath('candidates.0.content.parts.0.text', 'NEED AN EXPERT? A plumber can inspect the pipe.');
        Http::assertSentCount(1);
    }

    public function test_scanner_sends_the_actual_png_mime_type_and_rejects_a_mismatch(): void
    {
        $this->actingAs($this->user());
        $png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/cV8AAAAASUVORK5CYII=';
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [['content' => ['parts' => [['text' => 'NEED AN EXPERT? Ask a plumber.']]]]],
        ])]);

        $this->postJson('/api/scan-problem', ['image' => $png, 'mime_type' => 'image/png'])
            ->assertOk()
            ->assertJsonPath('candidates.0.content.parts.0.text', 'NEED AN EXPERT? Ask a plumber.');
        Http::assertSent(fn ($request) => data_get($request->data(), 'contents.0.parts.1.inline_data.mime_type') === 'image/png');

        $this->postJson('/api/scan-problem', ['image' => $png, 'mime_type' => 'image/jpeg'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('image');
        Http::assertSentCount(1);
    }

    public function test_google_tokens_remain_server_side_and_are_hidden_from_user_and_inertia_serialization(): void
    {
        $user = $this->user();
        $user->forceFill([
            'google_calendar_token' => 'private-access-value',
            'google_refresh_token' => 'private-refresh-value',
        ])->save();
        $user->setAttribute('google_token_expires_in', 'private-expiry-value');

        $this->assertSame('private-access-value', $user->google_calendar_token);
        $this->assertSame('private-refresh-value', $user->google_refresh_token);
        foreach (['google_calendar_token', 'google_refresh_token', 'google_token_expires_in'] as $attribute) {
            $this->assertArrayNotHasKey($attribute, $user->toArray());
        }

        $this->actingAs($user)->get('/login')
            ->assertOk()
            ->assertDontSee('private-access-value')
            ->assertDontSee('private-refresh-value')
            ->assertDontSee('private-expiry-value');
    }
}
