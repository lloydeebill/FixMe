<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureOnboardingComplete;
use App\Models\Booking;
use App\Models\RepairerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BookingWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(EnsureOnboardingComplete::class);
        Storage::fake('local');
    }

    private function people(string $status = 'confirmed'): array
    {
        $client = User::create(['name' => 'Client', 'email' => 'workflow-client@example.test', 'password' => 'password']);
        $provider = User::create(['name' => 'Provider', 'email' => 'workflow-provider@example.test', 'password' => 'password']);
        $other = User::create(['name' => 'Other', 'email' => 'workflow-other@example.test', 'password' => 'password']);
        $profile = RepairerProfile::create(['user_id' => $provider->user_id, 'business_name' => 'Test Provider']);
        $booking = Booking::create([
            'customer_id' => $client->user_id,
            'repairer_profile_id' => $profile->id,
            'service_type' => 'Plumbing',
            'scheduled_at' => now()->addDay(),
            'status' => $status,
        ]);
        return [$client, $provider, $other, $profile, $booking];
    }

    public function test_completion_request_notifies_once_and_dispute_blocks_payment_until_client_accepts(): void
    {
        [$client, $provider, $other, , $booking] = $this->people();
        $url = "/bookings/{$booking->id}";

        $this->actingAs($other)->get($url)->assertForbidden();
        $this->post("$url/complete")->assertForbidden();
        $this->actingAs($provider)->post("$url/complete")->assertRedirect();
        $this->post("$url/complete")->assertRedirect();
        $this->assertSame('completion_requested', $booking->fresh()->status);
        $this->assertDatabaseCount('messages', 1);
        $this->assertNull($booking->fresh()->client_accepted_at);
        $this->post("$url/accept-completion")->assertForbidden();

        $this->actingAs($client)->post("$url/report-issue", ['reason' => 'A leak remains'])->assertRedirect();
        $this->post("$url/report-issue", ['reason' => 'A leak remains'])->assertRedirect();
        $this->assertSame('completion_disputed', $booking->fresh()->status);
        $this->assertSame('A leak remains', $booking->fresh()->completion_issue_reason);
        $this->post("$url/payment-method", ['payment_method' => 'cash'])->assertSessionHasErrors('message');
        $this->post("$url/accept-completion")->assertSessionHasErrors('message');

        $this->actingAs($provider)->post("$url/complete")->assertRedirect();
        $this->assertDatabaseCount('messages', 2);
        $this->actingAs($client)->post("$url/accept-completion")->assertRedirect();
        $this->post("$url/accept-completion")->assertRedirect();
        $this->assertSame('completed', $booking->fresh()->status);
        $this->assertNotNull($booking->fresh()->client_accepted_at);
        $this->assertNull($booking->fresh()->completion_issue_reason);
    }

    public function test_cash_report_needs_provider_confirmation_and_review_needs_acceptance_not_payment(): void
    {
        [$client, $provider, $other, , $booking] = $this->people('completion_requested');
        $url = "/bookings/{$booking->id}";
        $review = ['rating' => 5, 'comment' => 'Good work'];

        $this->actingAs($client)->post("$url/review", $review)->assertSessionHasErrors('message');
        $this->post("$url/accept-completion")->assertRedirect();
        $this->post("$url/review", $review)->assertRedirect();
        $this->assertDatabaseCount('reviews', 1);
        $this->post("$url/review", $review)->assertSessionHasErrors('message');
        $this->actingAs($other)->post("$url/payment-method", ['payment_method' => 'cash'])->assertForbidden();
        $this->actingAs($client)->post("$url/payment-method", ['payment_method' => 'cash'])->assertRedirect();
        $this->post("$url/report-payment")->assertRedirect();
        $this->post("$url/report-payment")->assertRedirect();
        $this->assertNotNull($booking->fresh()->client_payment_reported_at);
        $this->assertNull($booking->fresh()->provider_payment_confirmed_at);
        $this->post("$url/confirm-payment")->assertForbidden();
        $this->actingAs($provider)->post("$url/confirm-payment")->assertRedirect();
        $confirmedAt = $booking->fresh()->provider_payment_confirmed_at;
        $this->post("$url/confirm-payment")->assertRedirect();
        $this->assertEquals($confirmedAt, $booking->fresh()->provider_payment_confirmed_at);
        $this->assertSame('completed', $booking->fresh()->status);
    }

    public function test_qr_requires_uploaded_image_acceptance_selected_method_and_exact_participation(): void
    {
        [$client, $provider, $other, $profile, $booking] = $this->people('completion_requested');
        $url = "/bookings/{$booking->id}";
        $this->actingAs($client)->get("$url/gcash-qr")->assertForbidden();
        $this->post("$url/payment-method", ['payment_method' => 'gcash_qr'])->assertSessionHasErrors('message');
        $this->post("$url/accept-completion")->assertRedirect();
        $this->post("$url/payment-method", ['payment_method' => 'gcash_qr'])->assertSessionHasErrors('payment_method');

        $this->actingAs($provider)->post('/provider/gcash-qr', ['qr_image' => UploadedFile::fake()->image('qr.png')])->assertRedirect();
        $path = $profile->fresh()->gcash_qr_path;
        $this->assertNotNull($path);
        Storage::disk('local')->assertExists($path);
        $this->get('/provider/gcash-qr/image')->assertOk();

        $this->actingAs($client)->get('/provider/gcash-qr/image')->assertForbidden();
        $this->post("$url/payment-method", ['payment_method' => 'gcash_qr'])->assertRedirect();
        $qrResponse = $this->get("$url/gcash-qr")->assertOk();
        $this->assertStringContainsString('no-store', $qrResponse->headers->get('Cache-Control'));
        $this->actingAs($other)->get("$url/gcash-qr")->assertForbidden();
        $this->actingAs($client)->post("$url/report-payment")->assertRedirect();
        $this->assertNull($booking->fresh()->provider_payment_confirmed_at);
        $this->actingAs($provider)->post("$url/confirm-payment")->assertRedirect();
        $this->assertNotNull($booking->fresh()->provider_payment_confirmed_at);
    }

    public function test_provider_cannot_confirm_early_and_removed_qr_blocks_reporting_until_cash_is_selected(): void
    {
        [$client, $provider, , $profile, $booking] = $this->people('completion_requested');
        $url = "/bookings/{$booking->id}";
        $this->actingAs($provider)->post("$url/confirm-payment")->assertSessionHasErrors('message');
        $this->actingAs($client)->post("$url/accept-completion")->assertRedirect();
        $this->actingAs($provider)->post('/provider/gcash-qr', ['qr_image' => UploadedFile::fake()->image('qr.png')])->assertRedirect();
        $this->actingAs($client)->post("$url/payment-method", ['payment_method' => 'gcash_qr'])->assertRedirect();
        $this->actingAs($provider)->delete('/provider/gcash-qr')->assertRedirect();
        $this->actingAs($client)->get("$url/gcash-qr")->assertNotFound();
        $this->post("$url/report-payment")->assertSessionHasErrors('message');
        $this->post("$url/payment-method", ['payment_method' => 'cash'])->assertRedirect();
        $this->post("$url/report-payment")->assertRedirect();
        $this->assertSame('cash', $booking->fresh()->payment_method);
        $this->assertNull($profile->fresh()->gcash_qr_path);
    }

    public function test_provider_can_replace_and_remove_only_own_qr(): void
    {
        [, $provider, $other, $profile] = $this->people();
        $this->actingAs($provider)->post('/provider/gcash-qr', ['qr_image' => UploadedFile::fake()->image('one.png')])->assertRedirect();
        $first = $profile->fresh()->gcash_qr_path;
        $this->post('/provider/gcash-qr', ['qr_image' => UploadedFile::fake()->image('two.jpg')])->assertRedirect();
        $second = $profile->fresh()->gcash_qr_path;
        $this->assertNotSame($first, $second);
        Storage::disk('local')->assertMissing($first);
        $this->actingAs($other)->delete('/provider/gcash-qr')->assertForbidden();
        $this->actingAs($provider)->delete('/provider/gcash-qr')->assertRedirect();
        $this->assertNull($profile->fresh()->gcash_qr_path);
        Storage::disk('local')->assertMissing($second);
    }

    public function test_historical_completed_booking_needs_explicit_client_acceptance_and_keeps_existing_status(): void
    {
        [$client, , , , $booking] = $this->people('completed');
        $url = "/bookings/{$booking->id}";
        $this->actingAs($client)->post("$url/review", ['rating' => 5])->assertSessionHasErrors('message');
        $this->assertSame('completed', $booking->fresh()->status);
        $this->post("$url/accept-completion")->assertRedirect();
        $this->post("$url/review", ['rating' => 5])->assertRedirect();
        $this->assertDatabaseCount('reviews', 1);
    }

    public function test_booking_actions_are_participant_only_and_qr_upload_rejects_other_files(): void
    {
        [$client, $provider, $other, , $booking] = $this->people('completion_requested');
        $url = "/bookings/{$booking->id}";
        $this->get($url)->assertRedirect();
        $this->actingAs($client)->get($url)->assertOk();
        $this->actingAs($provider)->get($url)->assertOk();
        $this->actingAs($other)->get($url)->assertForbidden();
        foreach (['accept-completion', 'report-issue', 'payment-method', 'report-payment', 'confirm-payment'] as $action) {
            $this->post("$url/$action", ['reason' => 'Test issue', 'payment_method' => 'cash'])->assertForbidden();
        }
        $this->actingAs($provider)->post('/provider/gcash-qr', [
            'qr_image' => UploadedFile::fake()->create('not-image.pdf', 100, 'application/pdf'),
        ])->assertSessionHasErrors('qr_image');
    }
}
