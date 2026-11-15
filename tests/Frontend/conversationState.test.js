import test from 'node:test';
import assert from 'node:assert/strict';
import { applyConversationEvent, sortConversations } from '../../resources/js/Pages/Dashboard/conversationState.js';

const initial = [
    { booking_id: 3, last_message_at: null, last_message_id: null, last_message_content: null },
    { booking_id: 2, last_message_at: '2026-11-14T08:00:00.000Z', last_message_id: 20, last_message_content: 'Second' },
    { booking_id: 1, last_message_at: '2026-11-14T09:00:00.000Z', last_message_id: 10, last_message_content: 'First' },
];

test('message timestamps order conversations and leave empty conversations last', () => {
    assert.deepEqual(sortConversations(initial).map(chat => chat.booking_id), [1, 2, 3]);
});

test('an incoming event updates preview and timestamp and moves its conversation first', () => {
    const updated = applyConversationEvent(initial, {
        bookingId: 2,
        message: { id: 21, sender_id: 7, content: 'New reply', created_at: '2026-11-14T10:00:00.000Z' },
    }, 8);
    assert.deepEqual(updated.map(chat => chat.booking_id), [2, 1, 3]);
    assert.equal(updated[0].last_message_content, 'New reply');
    assert.equal(updated[0].last_message_at, '2026-11-14T10:00:00.000Z');
    assert.equal(updated[0].last_message_time, 'Just now');
    assert.equal(updated[0].last_message_id, 21);
    assert.equal(initial[1].last_message_content, 'Second');
});

test('an older or duplicate event does not replace the latest preview', () => {
    const sorted = sortConversations(initial);
    const result = applyConversationEvent(sorted, {
        bookingId: 1,
        message: { id: 9, sender_id: 7, content: 'Stale', created_at: '2026-11-14T09:00:00.000Z' },
    }, 8);
    assert.strictEqual(result, sorted);
});

test('the first message moves an empty conversation above active ones', () => {
    const updated = applyConversationEvent(initial, {
        bookingId: 3,
        message: { id: 30, sender_id: 7, content: 'First message', created_at: '2026-11-14T11:00:00.000Z' },
    }, 8);
    assert.deepEqual(updated.map(chat => chat.booking_id), [3, 1, 2]);
    assert.equal(updated[0].last_message_content, 'First message');
});

test('own events and unknown bookings do not create duplicate summaries', () => {
    const own = applyConversationEvent(initial, { bookingId: 2, message: { id: 22, sender_id: 8, content: 'Own', created_at: '2026-11-14T10:00:00.000Z' } }, 8);
    const missing = applyConversationEvent(initial, { bookingId: 9, message: { id: 22, sender_id: 7, content: 'Unknown', created_at: '2026-11-14T10:00:00.000Z' } }, 8);
    assert.strictEqual(own, initial);
    assert.strictEqual(missing, initial);
});
