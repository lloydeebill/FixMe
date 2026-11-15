import test from 'node:test';
import assert from 'node:assert/strict';
import { nextConfirmedBooking, formatManilaSchedule } from '../../resources/js/Pages/Dashboard/Repairer/providerHomeBooking.js';

test('Home chooses the earliest future confirmed timestamp, excluding a pending request', () => {
    const jobs = [
        { id: 2, status: 'confirmed', scheduled_at: '2026-11-15T03:00:00.000Z' },
        { id: 3, status: 'pending', scheduled_at: '2026-11-14T23:00:00.000Z' },
        { id: 1, status: 'confirmed', scheduled_at: '2026-11-15T01:00:00.000Z' },
    ];
    assert.equal(nextConfirmedBooking(jobs, Date.parse('2026-11-14T12:00:00.000Z'))?.id, 1);
    assert.equal(nextConfirmedBooking(jobs, Date.parse('2026-11-16T00:00:00.000Z')), null);
    assert.equal(formatManilaSchedule(jobs[2].scheduled_at), 'Nov 15, 2026, 9:00 AM');
});
