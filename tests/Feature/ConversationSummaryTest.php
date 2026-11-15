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
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Inertia\Inertia;
use Tests\TestCase;

class ConversationSummaryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(EnsureOnboardingComplete::class);
        Event::fake([NewMessage::class]);
    }

    public function test_both_participants_see_conversations_ordered_by_actual_latest_message(): void
    {
        [$client, $provider, $bookings, $messages] = $this->fixtures();

        foreach ([$client, $provider] as $participant) {
            $this->actingAs($participant)->get('/app')->assertOk()->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('conversations', 3)
                ->where('conversations.0.booking_id', $bookings[0]->id)
                ->where('conversations.0.last_message_id', $messages[0]->id)
                ->where('conversations.0.last_message_content', 'Newest real message')
                ->where('conversations.0.last_message_at', $messages[0]->created_at->toISOString())
                ->where('conversations.1.booking_id', $bookings[1]->id)
                ->where('conversations.1.last_message_id', $messages[1]->id)
                ->where('conversations.1.last_message_content', 'Other conversation')
                ->where('conversations.2.booking_id', $bookings[2]->id)
                ->where('conversations.2.last_message_content', null)
                ->where('conversations.2.last_message_time', null)
                ->etc());
        }
    }

    public function test_new_message_updates_preview_timestamp_and_order_on_partial_reload(): void
    {
        [$client, $provider, $bookings] = $this->fixtures();

        $response = $this->actingAs($provider)->postJson("/api/messages/{$bookings[1]->id}", ['message' => 'Fresh reply']);
        $response->assertCreated();
        $savedId = $response->json('message.id');

        foreach ([$provider, $client] as $participant) {
            $partial = $this->actingAs($participant)->withHeaders([
                'X-Inertia' => 'true',
                'X-Inertia-Version' => Inertia::getVersion(),
                'X-Inertia-Partial-Component' => 'Dashboard',
                'X-Inertia-Partial-Data' => 'conversations',
            ])->get('/app')->assertOk();
            $partial->assertHeader('X-Inertia', 'true');
            $this->assertSame('Dashboard', $partial->json('component'));
            $summaries = $partial->json('props.conversations');
            $this->assertCount(3, $summaries);
            $this->assertSame([$bookings[1]->id, $bookings[0]->id, $bookings[2]->id], array_column($summaries, 'booking_id'));
            $this->assertSame($savedId, $summaries[0]['last_message_id']);
            $this->assertSame('Fresh reply', $summaries[0]['last_message_content']);
            $this->assertSame(Message::findOrFail($savedId)->created_at->toISOString(), $summaries[0]['last_message_at']);
        }
    }

    private function fixtures(): array
    {
        $client = User::factory()->create();
        $provider = User::factory()->create();
        $profile = RepairerProfile::create(['user_id' => $provider->user_id, 'business_name' => 'Test Provider']);
        $bookings = collect(range(1, 3))->map(fn ($number) => Booking::create([
            'customer_id' => $client->user_id,
            'repairer_profile_id' => $profile->id,
            'service_type' => "Test service {$number}",
            'scheduled_at' => now()->addDay(),
            'status' => 'confirmed',
        ]));
        $conversations = $bookings->map(fn ($booking) => Conversation::create([
            'booking_id' => $booking->id,
            'sender_id' => $client->user_id,
            'receiver_id' => $provider->user_id,
        ]));
        $messages = [
            $this->messageAt($conversations[0], $client, 'Newest real message', now()->subMinutes(2)),
            $this->messageAt($conversations[1], $client, 'Other conversation', now()->subMinutes(10)),
        ];
        // A higher message ID with an older timestamp must not replace the actual latest message.
        $this->messageAt($conversations[1], $client, 'Older timestamp', now()->subMinutes(20));

        return [$client, $provider, $bookings, $messages];
    }

    private function messageAt(Conversation $conversation, User $sender, string $content, $time): Message
    {
        $message = Message::create(['conversation_id' => $conversation->id, 'sender_id' => $sender->user_id, 'content' => $content]);
        $message->forceFill(['created_at' => $time, 'updated_at' => $time])->save();
        return $message->fresh();
    }
}
