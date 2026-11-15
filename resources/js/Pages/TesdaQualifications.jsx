import React, { useEffect, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import '../skilllink.css';
import { FiArrowLeft } from 'react-icons/fi';

const fields = [
    ['document_type', 'Document type'], ['holder_name', 'Holder name'],
    ['certificate_number', 'Certificate number'], ['qualification_title', 'Qualification'],
    ['nc_level', 'NC level'], ['issue_date', 'Issue date'],
    ['expiry_date', 'Expiry date'], ['issuing_office', 'Issuing office'],
];

const labels = {
    uploaded: 'Uploaded', processing: 'Processing', screening_complete: 'Screening complete',
    needs_clarification: 'Needs clarification', processing_failed: 'Processing failed',
};
const reviewLabels = {
    pending: 'Awaiting manual SkillLink review',
    registry_match: 'Registry match recorded by SkillLink',
    unconfirmed: 'Unable to confirm in registry',
    follow_up: 'Expiry or follow-up needed',
};

export default function TesdaQualifications({ qualifications = [] }) {
    const { data, setData, post, processing, errors, reset } = useForm({ certificate: null, consent: false });
    const [preview, setPreview] = useState(null);
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        if (!data.certificate) { setPreview(null); return; }
        const url = URL.createObjectURL(data.certificate);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [data.certificate]);

    const choose = (event) => {
        const file = event.target.files?.[0] || null;
        setLocalError('');
        if (file && (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
            setData('certificate', null);
            setLocalError('Choose a JPEG or PNG image up to 5 MB.');
            return;
        }
        setData('certificate', file);
        setData('consent', false);
    };

    const submit = (event) => {
        event.preventDefault();
        post('/provider/tesda-qualifications', {
            forceFormData: true,
            onSuccess: () => { reset(); setPreview(null); },
        });
    };

    return <main className="skilllink-screen min-h-screen px-4 py-6 sm:px-8 sm:py-10">
        <Head title="TESDA Qualifications" />
        <header className="-mx-4 -mt-6 mb-4 flex min-h-14 items-center gap-2 bg-white px-4 py-3 sm:hidden"><Link href="/app?tab=settings" aria-label="Back to Settings" className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-[#0965e8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0965e8]"><FiArrowLeft aria-hidden="true" /></Link><h1 className="min-w-0 text-xl font-semibold text-[#172335]">TESDA Qualifications</h1></header>
        <div className="mx-auto max-w-4xl">
            <Link href="/app" className="hidden text-sm font-semibold text-[#0965e8] sm:inline">← Back to dashboard</Link>
            <div className="mb-6 sm:mt-6">
                <span className="hidden text-2xl font-semibold text-[#0965e8] sm:inline">SkillLink</span>
                <h1 className="hidden text-xl font-semibold text-[#172335] sm:mt-5 sm:block sm:text-3xl">TESDA Qualifications</h1>
                <p className="mt-2 text-sm text-[#647084]">Automated screening checks readability and consistency. It does not confirm issuance by TESDA.</p>
            </div>

            <form onSubmit={submit} className="rounded-2xl border border-[#e3e8ef] bg-white p-5 sm:p-7">
                <h2 className="font-semibold">Add a qualification</h2>
                <label className="mt-4 block text-sm font-medium" htmlFor="certificate">Certificate image (JPEG or PNG, up to 5 MB)</label>
                <input id="certificate" type="file" accept="image/jpeg,image/png" onChange={choose} className="mt-2 block w-full rounded-xl border border-[#cbd5e1] p-2 text-sm" />
                {preview && <img src={preview} alt="Certificate preview" className="mt-4 max-h-72 max-w-full rounded-xl border border-[#e3e8ef] object-contain" />}
                {(localError || errors.certificate) && <p role="alert" className="mt-2 text-sm text-red-700">{localError || errors.certificate}</p>}
                <label className="mt-5 flex items-start gap-3 text-sm text-[#172335]">
                    <input type="checkbox" checked={data.consent} onChange={e => setData('consent', e.target.checked)} className="mt-1" />
                    <span>I consent to sending this certificate image to Google's Gemini service for preliminary screening.</span>
                </label>
                {errors.consent && <p role="alert" className="mt-2 text-sm text-red-700">{errors.consent}</p>}
                <button type="submit" disabled={!data.certificate || !data.consent || processing} className="mt-5 w-full rounded-xl bg-[#0965e8] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto">
                    {processing ? 'Screening…' : 'Submit for screening'}
                </button>
            </form>

            <section className="mt-8" aria-label="Saved qualifications">
                <h2 className="mb-4 text-lg font-semibold">Saved submissions</h2>
                {qualifications.length === 0 && <p className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white p-6 text-sm text-[#647084]">No qualifications submitted yet.</p>}
                <div className="grid gap-4 md:grid-cols-2">
                    {qualifications.map(item => <article key={item.id} className="min-w-0 rounded-2xl border border-[#e3e8ef] bg-white p-5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div><h3 className="font-semibold">Qualification #{item.id}</h3><p className="mt-1 text-xs text-[#647084]">Submitted {new Date(item.created_at).toLocaleDateString()}</p></div>
                            <span className="rounded-full bg-[#edf4ff] px-3 py-1 text-xs font-semibold text-[#0965e8]">{labels[item.processing_status]}</span>
                        </div>
                        <p className="mt-3 text-xs font-medium text-[#647084]">SkillLink review: {reviewLabels[item.verification_status] || 'Awaiting manual review'}</p>
                        {item.reviewed_at && <p className="mt-1 text-xs text-[#647084]">Reviewed {new Date(item.reviewed_at).toLocaleString()}</p>}
                        {item.review_note && <p className="mt-2 rounded-xl bg-[#edf4ff] p-3 text-sm text-[#172335]">{item.review_note}</p>}
                        {item.verification_status !== 'pending' && <p className="mt-2 text-xs text-[#647084]">This is SkillLink’s review record, not official TESDA certification.</p>}
                        <a href={`/provider/tesda-qualifications/${item.id}/image`} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-[#0965e8]">View private image</a>
                        {item.extracted_details && <dl className="mt-4 space-y-2 border-t border-[#e3e8ef] pt-4 text-sm">
                            {fields.map(([key, label]) => <div key={key} className="grid grid-cols-2 gap-3"><dt className="text-[#647084]">{label}</dt><dd className="break-words font-medium">{item.extracted_details[key] || 'Not readable'}</dd></div>)}
                        </dl>}
                        {item.issues?.length > 0 && <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><strong>Clarification needed</strong><ul className="mt-2 list-disc pl-5">{item.issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul></div>}
                        {item.failure_reason && <p role="alert" className="mt-4 text-sm text-red-700">{item.failure_reason}</p>}
                        <div className="mt-5 flex flex-wrap gap-3">
                            {item.processing_status === 'processing_failed' && <button type="button" onClick={() => router.post(`/provider/tesda-qualifications/${item.id}/retry`)} className="rounded-xl bg-[#0965e8] px-4 py-2 text-sm font-semibold text-white">Retry screening</button>}
                            {item.verification_status === 'pending' && <button type="button" onClick={() => { if (window.confirm('Delete this submission and its image?')) router.delete(`/provider/tesda-qualifications/${item.id}`); }} className="rounded-xl border border-[#e3e8ef] px-4 py-2 text-sm font-semibold text-red-700">Delete</button>}
                        </div>
                    </article>)}
                </div>
            </section>
        </div>
    </main>;
}
