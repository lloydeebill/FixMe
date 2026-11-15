import '../skilllink.css';
import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';

const fieldLabels = [
    ['document_type', 'Document type'], ['holder_name', 'Holder name'],
    ['certificate_number', 'Certificate number'], ['qualification_title', 'Qualification'],
    ['nc_level', 'NC level'], ['issue_date', 'Issue date'],
    ['expiry_date', 'Expiry date'], ['issuing_office', 'Issuing office'],
];
const outcomeLabels = {
    pending: 'Awaiting manual review',
    registry_match: 'Registry match recorded by SkillLink',
    unconfirmed: 'Unable to confirm in registry',
    follow_up: 'Expiry or follow-up needed',
};

function ReviewCard({ item }) {
    const [status, setStatus] = useState('');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const allowed = item.verification_status === 'pending'
        ? ['registry_match', 'unconfirmed', 'follow_up']
        : item.verification_status === 'follow_up' ? ['registry_match', 'unconfirmed'] : [];

    const submit = event => {
        event.preventDefault();
        if (busy || !status || note.trim().length < 5) return;
        setBusy(true);
        setError('');
        router.post(`/admin/qualifications/${item.id}/review`, { status, note }, {
            preserveScroll: true,
            onError: errors => setError(Object.values(errors)[0] || 'Review could not be saved.'),
            onFinish: () => setBusy(false),
        });
    };

    return <article className="rounded-2xl border border-[#e3e8ef] bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Submission #{item.id}</h2>
        <p className="mt-1 text-sm text-[#647084]">Provider: {item.provider_name || 'Unavailable'} · Screening: {item.processing_status}</p>
        <p className="mt-2 text-sm font-medium">SkillLink review: {outcomeLabels[item.verification_status] || item.verification_status}</p>
        <a href={`/admin/qualifications/${item.id}/image`} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[#0965e8]">View private submitted image</a>
        <dl className="mt-4 grid gap-3 border-t border-[#e3e8ef] pt-4 text-sm sm:grid-cols-2">
            {fieldLabels.map(([key, label]) => <div key={key}><dt className="text-[#647084]">{label}</dt><dd className="break-words font-medium">{item.extracted_details?.[key] || 'Not extracted'}</dd></div>)}
        </dl>
        {item.issues?.length > 0 && <p className="mt-4 text-sm text-amber-800">AI screening flagged: {item.issues.join('; ')}</p>}
        {item.reviewed_at && <p className="mt-4 text-sm text-[#647084]">Reviewed {new Date(item.reviewed_at).toLocaleString()} · Note: {item.review_note}</p>}
        {allowed.length > 0 && item.processing_status !== 'processing' && <form onSubmit={submit} className="mt-5 space-y-3 border-t border-[#e3e8ef] pt-4">
            <label htmlFor={`status-${item.id}`} className="block text-sm font-semibold">Manual registry outcome</label>
            <select id={`status-${item.id}`} value={status} onChange={event => setStatus(event.target.value)} className="w-full rounded-xl border border-[#cbd5e1] p-3 text-sm" required>
                <option value="">Choose an outcome</option>
                {allowed.map(value => <option key={value} value={value}>{outcomeLabels[value]}</option>)}
            </select>
            <label htmlFor={`note-${item.id}`} className="block text-sm font-semibold">Review note</label>
            <textarea id={`note-${item.id}`} value={note} onChange={event => setNote(event.target.value)} minLength={5} maxLength={1000} rows={3} className="w-full rounded-xl border border-[#cbd5e1] p-3 text-sm" required />
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button disabled={busy || !status || note.trim().length < 5} className="rounded-xl bg-[#0965e8] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Record SkillLink review'}</button>
        </form>}
    </article>;
}

export default function AdminQualifications({ qualifications = [] }) {
    return <main className="skilllink-screen min-h-screen bg-[#f4f6f8] p-4 text-[#172335] sm:p-8">
        <Head title="Qualification review" />
        <div className="mx-auto max-w-5xl">
            <Link href="/app?tab=settings" className="text-sm font-semibold text-[#0965e8]">← Back to Settings</Link>
            <h1 className="mt-4 text-2xl font-semibold">Qualification review</h1>
            <p className="mt-2 text-sm text-[#647084]">Compare the image and extracted details with TESDA’s registry yourself. AI screening never approves a submission. This is a SkillLink review record, not an official TESDA certification.</p>
            <a href="https://www.tesda.gov.ph/About/TESDA/31" target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-[#cbdcf6] bg-white px-4 text-sm font-semibold text-[#0965e8]">Open official TESDA Registry of Certified Workers ↗</a>
            <div className="mt-6 grid gap-4">{qualifications.length ? qualifications.map(item => <ReviewCard key={item.id} item={item} />) : <p className="rounded-xl bg-white p-5 text-sm">No qualification submissions yet.</p>}</div>
        </div>
    </main>;
}
