import '../skilllink.css';
import React, { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, useForm, router } from '@inertiajs/react';
import ProfileEditor from '@/Components/ProfileEditor';
import { FiArrowLeft } from 'react-icons/fi';

export default function Settings({ hasGcashQr = false, accountLocation, providerProfile, availableSkills = [] }) {
    // Get the logged-in user from the backend
    const { auth } = usePage().props;
    const user = auth.user;
    const section = new URLSearchParams(window.location.search).get('section');
    const openedFrom = new URLSearchParams(window.location.search).get('from');
    const providerPaymentView = Boolean(user.is_repairer) && section === 'payment';
    const providerProfileView = Boolean(user.is_repairer) && section === 'provider-profile';
    const clientProfileView = section === 'client-profile' || (!user.is_repairer && !section);
    const compactMobileView = providerPaymentView || clientProfileView || providerProfileView;
    const mobileBackHref = openedFrom === 'home'
        ? (clientProfileView ? '/app?tab=home&mode=client' : '/app?tab=home')
        : openedFrom === 'notifications' ? '/app?tab=notifications' : (clientProfileView ? '/app?tab=settings&mode=client' : '/app?tab=settings');
    const { data, setData, post, processing, errors, reset } = useForm({ qr_image: null });
    const [qrFeedback, setQrFeedback] = useState('');
    useEffect(() => {
        if (!qrFeedback) return;
        const timer = window.setTimeout(() => setQrFeedback(''), 5000);
        return () => window.clearTimeout(timer);
    }, [qrFeedback]);
    const [qrError, setQrError] = useState('');
    const [removingQr, setRemovingQr] = useState(false);
    const uploadQr = event => {
        event.preventDefault();
        setQrFeedback(''); setQrError('');
        post('/provider/gcash-qr', { forceFormData: true, onSuccess: () => { reset('qr_image'); setQrFeedback('GCash QR saved.'); }, onError: errors => setQrError(Object.values(errors)[0] || 'Could not save QR.') });
    };
    const removeQr = () => {
        if (removingQr) return;
        setRemovingQr(true); setQrFeedback(''); setQrError('');
        router.delete('/provider/gcash-qr', { onSuccess: () => setQrFeedback('GCash QR removed.'), onError: errors => setQrError(Object.values(errors)[0] || 'Could not remove QR.'), onFinish: () => setRemovingQr(false) });
    };

    return (
        <AuthenticatedLayout
            user={user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Account Settings</h2>}
            hideMobileNavigation={compactMobileView}
        >
            <Head title="Settings" />
            {compactMobileView && <header className="flex min-h-14 items-center gap-2 bg-white px-4 py-3 sm:hidden"><Link href={mobileBackHref} aria-label={openedFrom === 'home' ? 'Back to Home' : openedFrom === 'notifications' ? 'Back to Notifications' : 'Back to Settings'} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-[#0965e8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0965e8]"><FiArrowLeft aria-hidden="true" /></Link><h1 className="min-w-0 text-xl font-semibold text-[#172335]">{providerPaymentView ? 'Payment' : 'Profile'}</h1></header>}

            <div className={compactMobileView ? 'py-4 sm:py-12' : 'py-12'}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* 1. PROFILE INFORMATION CARD */}
                    <div className={`${providerPaymentView || providerProfileView ? 'hidden sm:block ' : ''}bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-gray-100`}>
                        <h3 className="mb-4 hidden text-lg font-bold text-gray-900 sm:block">Profile Information</h3>
                        <div className={`${clientProfileView ? 'hidden sm:grid ' : 'grid '}grid-cols-1 md:grid-cols-2 gap-6`}>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Full Name</label>
                                <p className="mt-1 text-lg font-semibold text-gray-900 break-words">{user.name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Email Address</label>
                                <p className="mt-1 text-lg font-semibold text-gray-900">{user.email}</p>
                            </div>
                        </div>
                        {clientProfileView && <ProfileEditor role="client" user={user} location={accountLocation} />}
                    </div>

                    {providerProfileView && <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8"><h2 className="mb-5 hidden text-lg font-semibold text-[#172335] sm:block">Edit Service Profile</h2><ProfileEditor role="provider" user={user} location={providerProfile?.location} profile={providerProfile} availableSkills={availableSkills} /></div>}

                    {/* 2. REPAIRER STATUS CARD */}
                    <div className={`${compactMobileView ? 'hidden sm:block ' : ''}rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8`}>
                        {user.is_repairer ? <><h3 className="text-lg font-semibold text-gray-900">Provider account</h3><p className="mt-2 text-sm text-gray-500">Your provider profile is active.</p></> : <><h3 className="text-lg font-semibold text-gray-900">Offer Services</h3><p className="mt-2 text-sm text-gray-500">Set up a provider profile and choose the services you offer. This does not verify TESDA qualifications.</p><Link href="/become-repairer" className="mt-4 inline-flex rounded-xl bg-[#0965e8] px-4 py-3 text-sm font-semibold text-white">Offer Services</Link></>}
                    </div>

                    {user.is_repairer && <div className={`${compactMobileView ? 'hidden sm:block ' : ''}rounded-2xl border border-gray-100 bg-white p-5 sm:p-8`}>
                        <h3 className="text-lg font-semibold">TESDA Qualifications</h3>
                        <p className="mt-2 text-sm text-gray-500">Keep your certificate submissions and screening results in your provider account.</p>
                        <Link href="/provider/tesda-qualifications" className="mt-4 inline-block rounded-xl bg-[#0965e8] px-4 py-3 text-sm font-semibold text-white">Manage qualifications</Link>
                    </div>}

                    {user.is_admin && <div className={`${compactMobileView ? 'hidden sm:block ' : ''}rounded-2xl border border-gray-100 bg-white p-5 sm:p-8`}><h3 className="text-lg font-semibold">Qualification review</h3><p className="mt-2 text-sm text-gray-500">Review submitted images and record a manual SkillLink registry outcome.</p><Link href="/admin/qualifications" className="mt-4 inline-block rounded-xl bg-[#0965e8] px-4 py-3 text-sm font-semibold text-white">Open review queue</Link></div>}

                    {user.is_repairer && <section className={`${clientProfileView || providerProfileView ? 'hidden sm:block ' : ''}rounded-2xl border border-gray-100 bg-white p-5 sm:p-8`} aria-label="GCash QR settings">
                        <h3 className="text-lg font-semibold">GCash payment QR</h3>
                        <p className="mt-2 text-sm text-gray-500">Clients can view this QR only after accepting completed work and choosing external GCash payment. SkillLink does not verify transfers.</p>
                        {hasGcashQr && <div className="mt-4"><img src="/provider/gcash-qr/image" alt="Your saved GCash QR" className="max-h-56 max-w-full rounded-xl border border-gray-200" /><button type="button" disabled={removingQr} onClick={removeQr} className="mt-3 block text-sm font-semibold text-red-700 disabled:opacity-50">{removingQr ? 'Removing…' : 'Remove QR'}</button></div>}
                        <form onSubmit={uploadQr} className="mt-4 space-y-3">
                            <label htmlFor="gcash-qr-file" className="block text-sm font-medium">{hasGcashQr ? 'Replace QR image' : 'Upload QR image'}</label>
                            <input id="gcash-qr-file" type="file" accept="image/png,image/jpeg" onChange={event => setData('qr_image', event.target.files?.[0] || null)} className="block w-full text-sm" />
                            {errors.qr_image && <p role="alert" className="text-sm text-red-700">{errors.qr_image}</p>}
                            {qrError && <p role="alert" className="text-sm text-red-700">{qrError}</p>}
                            {qrFeedback && <p role="status" className="text-sm text-green-800">{qrFeedback}</p>}
                            <button type="submit" disabled={!data.qr_image || processing} className="rounded-xl bg-[#0965e8] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Save QR</button>
                        </form>
                    </section>}

                    {/* 3. LOGOUT BUTTON (Optional Red Zone) */}
                    <div className={`${compactMobileView ? 'hidden sm:flex' : 'flex'} justify-end`}>
                        <Link
                            href={'/logout'}
                            method="post"
                            as="button"
                            className="text-red-600 font-semibold hover:text-red-800 transition text-sm"
                        >
                            Log Out
                        </Link>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
