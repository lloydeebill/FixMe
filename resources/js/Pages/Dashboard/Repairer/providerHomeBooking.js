// Booking.scheduled_at is serialized by Laravel as an ISO timestamp with an offset.
// Compare instants, then format the selected instant in the app's Manila timezone.
export function nextConfirmedBooking(jobs, now = Date.now()) {
    return jobs
        .filter(job => job.status === 'confirmed' && Number.isFinite(Date.parse(job.scheduled_at)) && Date.parse(job.scheduled_at) >= now)
        .sort((a, b) => Date.parse(a.scheduled_at) - Date.parse(b.scheduled_at))[0] ?? null;
}

export function formatManilaSchedule(timestamp) {
    const date = new Date(timestamp);
    if (!Number.isFinite(date.getTime())) return 'Schedule unavailable';
    return new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila',
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit',
    }).format(date);
}
