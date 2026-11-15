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
const registrySources = { '2017_onward': '2017 onward', '2016_earlier': '2016 and earlier' };
const registryResults = {
    match_found: 'Matching registry entry observed', no_match: 'No matching entry found',
    unavailable: 'Registry unavailable', expired: 'Entry indicates expiry',
    needs_follow_up: 'Lookup needs follow-up',
};
const compatibleResults = {
    registry_match: ['match_found'], unconfirmed: ['no_match', 'unavailable'],
    follow_up: ['expired', 'needs_follow_up'],
};

function ReviewCard({ item }) {
    const [status, setStatus] = useState('');
    const [note, setNote] = useState('');
    const [registrySource, setRegistrySource] = useState('');
    const [registryReference, setRegistryReference] = useState('');
    const [registryCheckedOn, setRegistryCheckedOn] = useState('');
    const [registryResult, setRegistryResult] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const allowed = item.verification_status === 'pending'
        ? ['registry_match', 'unconfirmed', 'follow_up']
        : item.verification_status === 'follow_up' ? ['registry_match', 'unconfirmed'] : [];

    const submit = event => {
        event.preventDefault();
        if (busy || !status || !registryResult || !registrySource || !registryReference || !registryCheckedOn || note.trim().length < 5) return;
        setBusy(true);
        setError('');
        router.post(`/admin/qualifications/${item.id}/review`, {
            status, note, registry_source: registrySource, registry_reference: registryReference,
            registry_checked_on: registryCheckedOn, registry_result: registryResult,
        }, {
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
        {item.registry_checked_on && <p className="mt-2 text-sm text-[#647084]">Admin-recorded TESDA registry lookup: {registrySources[item.registry_source] || item.registry_source} · {String(item.registry_checked_on).slice(0, 10)} · {registryResults[item.registry_result] || item.registry_result}. This is not independent official verification.</p>}
        {item.registry_reference && <a href={item.registry_reference} target="_blank" rel="noreferrer" className="mt-2 inline-block break-all text-sm text-[#0965e8]">Recorded official registry page ↗</a>}
        {item.review_history?.length > 0 && <details className="mt-5 border-t border-[#e3e8ef] pt-4"><summary className="cursor-pointer text-sm font-semibold text-[#172335]">Manual review history ({item.review_history.length})</summary>
            <ol className="mt-3 space-y-3">{item.review_history.map(review => <li key={review.id} className="rounded-xl bg-[#f4f6f8] p-3 text-sm">
                <strong className="block">{outcomeLabels[review.outcome] || review.outcome}</strong>
                <span className="text-[#647084]">Recorded {new Date(review.reviewed_at).toLocaleString()} by reviewer #{review.reviewer_id}</span>
                <p className="mt-1">TESDA registry {registrySources[review.registry_source] || review.registry_source}; lookup date {review.registry_checked_on}; observed result: {registryResults[review.registry_result] || review.registry_result}.</p>
                <p className="mt-1 whitespace-pre-wrap">{review.review_note}</p>
                <a href={review.registry_reference} target="_blank" rel="noreferrer" className="mt-1 inline-block break-all text-[#0965e8]">Recorded official registry page ↗</a>
            </li>)}</ol>
        </details>}
        {allowed.length > 0 && item.processing_status !== 'processing' && <form onSubmit={submit} className="mt-5 space-y-3 border-t border-[#e3e8ef] pt-4">
            <label htmlFor={`status-${item.id}`} className="block text-sm font-semibold">Manual registry outcome</label>
            <select id={`status-${item.id}`} value={status} onChange={event => { setStatus(event.target.value); setRegistryResult(''); }} className="w-full rounded-xl border border-[#cbd5e1] p-3 text-sm" required>
                <option value="">Choose an outcome</option>
                {allowed.map(value => <option key={value} value={value}>{outcomeLabels[value]}</option>)}
            </select>
            <label htmlFor={`registry-source-${item.id}`} className="block text-sm font-semibold">TESDA registry section checked</label>
            <select id={`registry-source-${item.id}`} value={registrySource} onChange={event => setRegistrySource(event.target.value)} className="w-full rounded-xl border border-[#cbd5e1] p-3 text-sm" required>
                <option value="">Choose registry section</option>
                {Object.entries(registrySources).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <label htmlFor={`registry-reference-${item.id}`} className="block text-sm font-semibold">Official TESDA registry page URL</label>
            <input id={`registry-reference-${item.id}`} type="url" value={registryReference} onChange={event => setRegistryReference(event.target.value)} maxLength={500} placeholder="https://www.tesda.gov.ph/…" className="w-full rounded-xl border border-[#cbd5e1] p-3 text-sm" required />
            <label htmlFor={`registry-date-${item.id}`} className="block text-sm font-semibold">Date checked</label>
            <input id={`registry-date-${item.id}`} type="date" value={registryCheckedOn} onChange={event => setRegistryCheckedOn(event.target.value)} className="w-full rounded-xl border border-[#cbd5e1] p-3 text-sm" required />
            <label htmlFor={`registry-result-${item.id}`} className="block text-sm font-semibold">Observed registry result</label>
            <select id={`registry-result-${item.id}`} value={registryResult} onChange={event => setRegistryResult(event.target.value)} className="w-full rounded-xl border border-[#cbd5e1] p-3 text-sm" required>
                <option value="">Choose observed result</option>
                {(compatibleResults[status] || []).map(value => <option key={value} value={value}>{registryResults[value]}</option>)}
            </select>
            <label htmlFor={`note-${item.id}`} className="block text-sm font-semibold">Review note</label>
            <textarea id={`note-${item.id}`} value={note} onChange={event => setNote(event.target.value)} minLength={5} maxLength={1000} rows={3} className="w-full rounded-xl border border-[#cbd5e1] p-3 text-sm" required />
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button disabled={busy || !status || !registryResult || !registrySource || !registryReference || !registryCheckedOn || note.trim().length < 5} className="rounded-xl bg-[#0965e8] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Record SkillLink review'}</button>
        </form>}
    </article>;
}

export default function AdminQualifications({ qualifications = { data: [], links: [], total: 0, from: null, to: null } }) {
    return <main className="skilllink-screen min-h-screen bg-[#f4f6f8] p-4 text-[#172335] sm:p-8">
        <Head title="Qualification review" />
        <div className="mx-auto max-w-5xl">
            <Link href="/app?tab=settings" className="text-sm font-semibold text-[#0965e8]">← Back to Settings</Link>
            <h1 className="mt-4 text-2xl font-semibold">Qualification review</h1>
            <p className="mt-2 text-sm text-[#647084]">Compare the image and extracted details with TESDA’s registry yourself. AI screening never approves a submission. This is a SkillLink review record, not an official TESDA certification.</p>
            <a href="https://www.tesda.gov.ph/About/TESDA/31" target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-[#cbdcf6] bg-white px-4 text-sm font-semibold text-[#0965e8]">Open official TESDA Registry of Certified Workers ↗</a>
            <p className="mt-5 text-sm text-[#647084]">{qualifications.total ? `Showing ${qualifications.from}–${qualifications.to} of ${qualifications.total} submissions` : 'No qualification submissions yet.'}</p>
            <div className="mt-3 grid gap-4">{qualifications.data.map(item => <ReviewCard key={item.id} item={item} />)}</div>
            {qualifications.links.length > 3 && <nav aria-label="Qualification pages" className="mt-6 flex flex-wrap gap-2">{qualifications.links.map((link, index) => {
                const label = link.label.includes('Previous') ? 'Previous' : link.label.includes('Next') ? 'Next' : link.label;
                return link.url
                    ? <Link key={index} href={link.url} preserveScroll aria-current={link.active ? 'page' : undefined} className={`rounded-lg px-3 py-2 text-sm ${link.active ? 'bg-[#0965e8] text-white' : 'border border-[#cbdcf6] bg-white text-[#0965e8]'}`}>{label}</Link>
                    : <span key={index} className="rounded-lg px-3 py-2 text-sm text-[#647084]">{label}</span>;
            })}</nav>}
        </div>
    </main>;
}
