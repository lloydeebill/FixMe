<?php

namespace Tests\Feature;

use App\Events\NewMessage;
use App\Http\Middleware\EnsureOnboardingComplete;
use App\Models\Booking;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\RepairerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Broadcasting\PendingBroadcast;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Mockery;
use Tests\TestCase;

class MessagingAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(EnsureOnboardingComplete::class);
        Event::fake([NewMessage::class]);
    }

    private function booking(): array
    {
        $customer = User::create(['name' => 'Customer', 'email' => 'customer@example.test', 'password' => 'password']);
        $provider = User::create(['name' => 'Provider', 'email' => 'provider@example.test', 'password' => 'password']);
        $profile = RepairerProfile::create(['user_id' => $provider->user_id, 'business_name' => 'Example Provider']);
        $booking = Booking::create([
            'customer_id' => $customer->user_id,
            'repairer_profile_id' => $profile->id,
            'service_type' => 'Plumbing',
            'scheduled_at' => now()->addDay(),
            'status' => 'confirmed',
        ]);
        $conversation = Conversation::create([
            'booking_id' => $booking->id,
            'sender_id' => $customer->user_id,
            'receiver_id' => $provider->user_id,
        ]);
        Message::create(['conversation_id' => $conversation->id, 'sender_id' => $customer->user_id, 'content' => 'Existing message']);

        return [$customer, $provider, $booking];
    }

    public function test_booking_participants_can_read_and_send_messages(): void
    {
        [$customer, $provider, $booking] = $this->booking();

        foreach ([$customer, $provider] as $participant) {
            $this->actingAs($participant)
                ->getJson("/api/messages/{$booking->id}")
                ->assertOk()
                ->assertJsonFragment(['content' => 'Existing message']);
            $this->getJson("/api/bookings/{$booking->id}/messages")
                ->assertOk()
                ->assertJsonFragment(['content' => 'Existing message']);
            $this->post("/api/messages/{$booking->id}", ['message' => 'Hello from '.$participant->name])
                ->assertCreated()->assertJsonStructure(['message' => ['id', 'content']]);
            $this->post("/api/bookings/{$booking->id}/messages", ['message' => 'Second route from '.$participant->name])
                ->assertCreated()->assertJsonStructure(['message' => ['id', 'content']]);
            $this->assertDatabaseHas('messages', ['sender_id' => $participant->user_id, 'content' => 'Hello from '.$participant->name]);
            $this->assertDatabaseHas('messages', ['sender_id' => $participant->user_id, 'content' => 'Second route from '.$participant->name]);
        }

        Event::assertDispatchedTimes(NewMessage::class, 4);
        Event::assertDispatched(NewMessage::class, fn (NewMessage $event) =>
            $event->bookingId === $booking->id
            && $event->receiverId === $provider->user_id
            && $event->broadcastOn()[0]->name === 'private-messages.'.$provider->user_id
        );
    }

    public function test_broadcast_failure_does_not_fail_a_saved_message(): void
    {
        [$customer, , $booking] = $this->booking();
        Log::spy();
        $dispatcher = Mockery::mock(Dispatcher::class);
        $dispatcher->shouldReceive('dispatch')
            ->once()
            ->andThrow(new BroadcastException('Invalid upstream key'));
        Broadcast::shouldReceive('event')
            ->once()
            ->andReturnUsing(fn (NewMessage $event) => new PendingBroadcast($dispatcher, $event));

        $response = $this->actingAs($customer)->postJson("/api/messages/{$booking->id}", [
            'message' => 'Message with failed broadcast',
        ]);

        $response->assertCreated()->assertJsonStructure(['message' => ['id', 'content']]);
        $messageId = $response->json('message.id');
        $this->assertNotNull($messageId);
        $this->assertDatabaseCount('messages', 2);
        $this->assertDatabaseHas('messages', ['id' => $messageId, 'content' => 'Message with failed broadcast']);
        $this->getJson("/api/messages/{$booking->id}")
            ->assertOk()
            ->assertJsonFragment(['id' => $messageId, 'content' => 'Message with failed broadcast']);
        Log::shouldHaveReceived('warning')
            ->once()
            ->withArgs(fn ($text, $context) => $text === 'Chat broadcast failed'
                && $context === [
                    'exception_type' => BroadcastException::class,
                    'connection' => config('broadcasting.default'),
                ]);
    }

    public function test_chat_page_and_inertia_version_conflict_headers(): void
    {
        [$customer, , $booking] = $this->booking();
        $path = "/test-chat/{$booking->id}";

        $page = $this->actingAs($customer)->get($path)->assertOk();
        $this->assertFalse($page->headers->has('Content-Security-Policy'));

        $conflict = $this->withHeaders([
            'X-Inertia' => 'true',
            'X-Inertia-Version' => 'stale-version',
        ])->get($path)->assertStatus(409);
        $conflict->assertHeader('X-Inertia-Location', url($path));
        $this->assertFalse($conflict->headers->has('Content-Security-Policy'));
        $this->assertSame('', $conflict->getContent());
    }

    public function test_unrelated_user_cannot_read_or_send_on_either_message_route(): void
    {
        [, , $booking] = $this->booking();
        $stranger = User::create(['name' => 'Stranger', 'email' => 'stranger@example.test', 'password' => 'password']);
        $this->actingAs($stranger);

        $this->getJson("/api/messages/{$booking->id}")->assertForbidden();
        $this->postJson("/api/messages/{$booking->id}", ['message' => 'Intrusion'])->assertForbidden();
        $this->getJson("/api/bookings/{$booking->id}/messages")->assertForbidden();
        $this->postJson("/api/bookings/{$booking->id}/messages", ['message' => 'Intrusion'])->assertForbidden();
        $this->assertDatabaseMissing('messages', ['content' => 'Intrusion']);
    }

    public function test_private_message_channel_belongs_only_to_its_user(): void
    {
        config()->set('broadcasting.default', 'pusher');
        config()->set('broadcasting.connections.pusher.key', 'test-key');
        config()->set('broadcasting.connections.pusher.secret', 'test-secret');
        config()->set('broadcasting.connections.pusher.app_id', 'test-id');
        require base_path('routes/channels.php');

        [$customer, $provider] = $this->booking();
        $channel = ['socket_id' => '123.456', 'channel_name' => 'private-messages.'.$customer->user_id];

        $this->actingAs($customer)->postJson('/broadcasting/auth', $channel)->assertOk();
        $this->actingAs($provider)->postJson('/broadcasting/auth', $channel)->assertForbidden();
    }
}
