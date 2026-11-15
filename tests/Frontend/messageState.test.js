import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeMessages, isIncomingForBooking } from '../../resources/js/Pages/Chat/messageState.js';

test('poll and broadcast copies of one message are shown once in order', () => {
    const first = { id: 1, content: 'First' };
    const second = { id: 2, content: 'Second' };
    assert.deepEqual(mergeMessages([first, second], [{ ...second, id: '2' }, first]), [first, { ...second, id: '2' }]);
});

test('events for another booking or the current sender are ignored', () => {
    const event = { bookingId: 12, message: { id: 3, sender_id: 2 } };
    assert.equal(isIncomingForBooking(event, 12, 1), true);
    assert.equal(isIncomingForBooking(event, 13, 1), false);
    assert.equal(isIncomingForBooking(event, 12, 2), false);
});
