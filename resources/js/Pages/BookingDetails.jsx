import '../skilllink.css';
import React, { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import ReviewModal from '../Components/ReviewModal';
import BookingLocationsMap from './Dashboard/BookingLocationsMap';

export default function BookingDetails({ booking, participantRole, hasGcashQr, serviceLocation, providerLocation, distanceKm, isGoogleConnected }) {
    const returnQuery = new URLSearchParams(window.location.search);
    const backUrl = returnQuery.get('from') === 'notifications'
        ? `/app?tab=notifications${returnQuery.get('mode') === 'client' ? '&mode=client' : ''}`
        : '/app';
    const [reason, setReason] = useState('');
    const [method, setMethod] = useState(booking.payment_method || 'cash');
    const [reviewing, setReviewing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    useEffect(() => {
        if (!success) return;
        const timer = window.setTimeout(() => setSuccess(''), 5000);
        return () => window.clearTimeout(timer);
    }, [success]);
    const client = participantRole === 'client';
    const accepted = booking.status === 'completed' && Boolean(booking.client_accepted_at);
    const legacy = booking.status === 'completed' && !booking.client_accepted_at;

    const submit = (suffix, data = {}) => {
        if (busy) return;
        setBusy(true);
        setError('');
        setSuccess('');
        router.post(`/bookings/${booking.id}/${suffix}`, data, {
            preserveScroll: true,
            onSuccess: page => {
                if (page.props.flash?.error) setError(page.props.flash.error);
                else setSuccess(page.props.flash?.message || 'Action saved.');
            },
            onError: errors => setError(Object.values(errors)[0] || 'Please try again.'),
            onFinish: () => setBusy(false),
        });
    };

    return <main className="skilllink-screen min-h-screen bg-[#f4f6f8] px-4 py-5 text-[#172335] sm:px-6 sm:py-8">
        <Head title={`Booking #${booking.id}`} />
        <div className="mx-auto max-w-2xl space-y-4">
            {success && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{success}</p>}
            {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {busy && <p role="status" className="text-sm text-[#647084]">Saving…</p>}
            <Link href={backUrl} className="inline-flex rounded-lg px-2 py-2 text-sm font-semibold text-[#0965e8]">← {returnQuery.get('from') === 'notifications' ? 'Notifications' : 'Back to dashboard'}</Link>
            <section className="rounded-2xl border border-[#e3e8ef] bg-white p-5 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#647084]">Booking #{booking.id}</p>
                <h1 className="mt-2 text-2xl font-semibold">{booking.service_type}</h1>
                <p className="mt-2 text-sm text-[#647084]">{booking.repairer_profile?.business_name || 'Service provider'} · {new Date(booking.scheduled_at).toLocaleString()}</p>
                <Link href={`/test-chat/${booking.id}`} className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-[#cbdcf6] px-4 text-sm font-semibold text-[#0965e8]">Open conversation</Link>
            </section>

            {!client && ['confirmed', 'in_progress', 'completion_requested', 'completion_disputed', 'completed'].includes(booking.status) && <section className="rounded-2xl border border-[#e3e8ef] bg-white p-5 sm:p-7">
                <h2 className="text-lg font-semibold">Google Calendar (optional)</h2>
                {booking.google_event_id ? <p className="mt-2 text-sm text-green-700">This booking was added to your Google Calendar. Guest updates were requested.</p> : <>
                    <p className="mt-2 text-sm text-[#647084]">This booking is saved in SkillLink. Google Calendar is separate.</p>
                    {isGoogleConnected ? <button type="button" disabled={busy} onClick={() => submit('sync-calendar')} className="mt-4 rounded-xl bg-[#0965e8] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Add to Google Calendar</button> : <a href="/auth/calendar/connect" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#0965e8] px-4 py-3 text-sm font-semibold text-white">Connect Google Calendar</a>}
                </>}
            </section>}

            {serviceLocation && <section className="rounded-2xl border border-[#e3e8ef] bg-white p-5 sm:p-7">
                <h2 className="text-lg font-semibold">Saved service locations</h2>
                <p className="mt-1 text-xs text-[#647084]">Saved locations for this booking, not live GPS tracking.</p>
                <div className="my-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div><strong className="block text-[#172335]">Client service address</strong><span className="text-[#647084]">{serviceLocation.address || 'Address not saved'}</span>{(serviceLocation.latitude == null || serviceLocation.longitude == null) && <p className="mt-1 text-xs text-[#647084]">Service location pin unavailable.</p>}</div>
                    <div><strong className="block text-[#172335]">Provider service location</strong><span className="text-[#647084]">{providerLocation?.address || 'Address or area not saved'}</span></div>
                </div>
                <p className="mb-2 text-sm font-semibold text-[#172335]">{distanceKm == null ? 'Distance unavailable' : `About ${distanceKm} km between saved pins`}</p>
                <p className="mb-3 text-xs text-[#647084]">Approximate straight-line distance, not driving distance or live location.</p>
                {(providerLocation?.latitude == null || providerLocation?.longitude == null) && <p className="mb-3 text-xs text-[#647084]">Provider service pin unavailable, so distance cannot be calculated.</p>}
                <BookingLocationsMap serviceLocation={serviceLocation} providerLocation={providerLocation} />
            </section>}

            <section className="rounded-2xl border border-[#e3e8ef] bg-white p-5 sm:p-7">
                <h2 className="text-lg font-semibold">Work completion</h2>
                {booking.status === 'confirmed' && <p className="mt-2 text-sm text-[#647084]">Work is confirmed. The provider can request client confirmation when finished.</p>}
                {booking.status === 'completion_requested' && <p className="mt-2 text-sm text-[#647084]">Provider reports the work is finished. Client confirmation is pending.</p>}
                {booking.status === 'completion_disputed' && <p className="mt-2 text-sm text-[#647084]">Client reported an issue. Work completion is not accepted.</p>}
                {booking.completion_issue_reason && !accepted && <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><strong>Issue reported:</strong> {booking.completion_issue_reason}</div>}
                {legacy && <p className="mt-2 text-sm text-[#647084]">This is a historical completed booking. It has not been confirmed through the new client acceptance step.</p>}
                {accepted && <p className="mt-2 text-sm font-semibold text-green-700">Work accepted by client.</p>}

                {!client && (booking.status === 'confirmed' || booking.status === 'completion_disputed') && <button type="button" disabled={busy} onClick={() => submit('complete')} className="mt-4 rounded-xl bg-[#0965e8] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{booking.status === 'completion_disputed' ? 'Request confirmation again' : 'Work finished — request client confirmation'}</button>}
                {client && (booking.status === 'completion_requested' || legacy) && <button type="button" disabled={busy} onClick={() => submit('accept-completion')} className="mt-4 rounded-xl bg-[#0965e8] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Accept completed work</button>}
                {client && booking.status === 'completion_requested' && <div className="mt-5 border-t border-gray-100 pt-4"><label htmlFor="completion-reason" className="block text-sm font-semibold">Report an issue</label><textarea id="completion-reason" maxLength={300} value={reason} onChange={event => setReason(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-gray-200 p-3 text-sm" placeholder="Briefly explain what still needs attention" /><button type="button" disabled={busy || reason.trim().length < 5} onClick={() => submit('report-issue', { reason })} className="mt-2 rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-semibold text-amber-900 disabled:opacity-50">Send issue to provider</button></div>}
            </section>

            {accepted && <section className="rounded-2xl border border-[#e3e8ef] bg-white p-5 sm:p-7">
                <h2 className="text-lg font-semibold">External payment</h2>
                <p className="mt-2 text-sm text-[#647084]">Payment happens in person or in your own GCash app. SkillLink cannot verify a transfer automatically.</p>
                {client && !booking.client_payment_reported_at && <>
                    <fieldset className="mt-4 space-y-2"><legend className="text-sm font-semibold">Payment method</legend>
                        <label className="flex items-center gap-2 text-sm"><input type="radio" name="payment_method" checked={method === 'cash'} onChange={() => setMethod('cash')} /> Cash paid in person</label>
                        <label className="flex items-center gap-2 text-sm"><input type="radio" name="payment_method" checked={method === 'gcash_qr'} onChange={() => setMethod('gcash_qr')} /> Pay externally using GCash QR</label>
                    </fieldset>
                    {method === 'gcash_qr' && !hasGcashQr && <p className="mt-3 text-sm text-amber-800">This provider has no GCash QR uploaded. Please choose cash.</p>}
                    {booking.payment_method !== method && <button type="button" disabled={busy || (method === 'gcash_qr' && !hasGcashQr)} onClick={() => submit('payment-method', { payment_method: method })} className="mt-4 rounded-xl bg-[#0965e8] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Choose {method === 'cash' ? 'cash' : 'GCash QR'}</button>}
                    {booking.payment_method === 'gcash_qr' && method === 'gcash_qr' && hasGcashQr && <div className="mt-4"><img src={`/bookings/${booking.id}/gcash-qr`} alt="Provider GCash QR for external payment" className="max-h-72 max-w-full rounded-xl border border-gray-200" /><p className="mt-2 text-xs text-[#647084]">Pay in your own GCash app, then report that you sent payment.</p></div>}
                    {booking.payment_method === method && (method === 'cash' || hasGcashQr) && <button type="button" disabled={busy} onClick={() => submit('report-payment')} className="mt-4 block rounded-xl bg-[#0965e8] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{method === 'cash' ? 'I paid in person' : 'I sent payment'}</button>}
                </>}
                {booking.client_payment_reported_at && !booking.provider_payment_confirmed_at && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">Awaiting provider confirmation of receipt.</p>}
                {booking.provider_payment_confirmed_at && <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800">Payment received — confirmed by provider.</p>}
                {!client && booking.client_payment_reported_at && !booking.provider_payment_confirmed_at && <button type="button" disabled={busy} onClick={() => submit('confirm-payment')} className="mt-4 rounded-xl bg-[#0965e8] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Payment received</button>}
                {!client && !booking.client_payment_reported_at && <p className="mt-3 text-sm text-[#647084]">Waiting for the client to record payment. Check what you actually receive before confirming.</p>}
            </section>}

            {client && accepted && !booking.review && <button type="button" onClick={() => setReviewing(true)} className="rounded-xl border border-[#cbdcf6] bg-white px-4 py-3 text-sm font-semibold text-[#0965e8]">Leave a review</button>}
        </div>
        {reviewing && <ReviewModal booking={booking} onClose={() => setReviewing(false)} />}
    </main>;
}
