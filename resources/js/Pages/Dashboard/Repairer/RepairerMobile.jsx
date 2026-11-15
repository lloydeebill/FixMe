import '../../../skilllink.css';
import { FiBriefcase, FiMessageCircle, FiUser, FiChevronRight, FiFileText, FiCreditCard, FiLogOut, FiArrowLeft, FiHome, FiEdit2, FiBell, FiSettings } from 'react-icons/fi';
import React, { useEffect, useRef, useState } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import useMobileTab from '../useMobileTab';
import NotificationsView from '../NotificationsView';
import BookingLocationsMap from '../BookingLocationsMap';
import { nextConfirmedBooking, formatManilaSchedule } from './providerHomeBooking';
// --- MAIN COMPONENT ---

export default function RepairerMobile({
    user,
    profile,
    jobs = [],
    schedule = [],
    isGoogleConnected = false,
    conversations = [],
    notifications = [],
    unreadNotificationsCount = 0,
    jobCounts = { pending: 0, active: 0, completed: 0 },
    onOpenNotification,
    onSwitchToCustomer,
    onApprove,
    onReject,
    onComplete,
    actionBusy = false,
    actionFeedback = null,
    onLogout
}) {
    // STATE
    const [activeTab, setActiveTab, backTo] = useMobileTab('home');
    const [jobsSubView, setJobsSubView] = useState(() => new URLSearchParams(window.location.search).get('job') === 'pending' ? 'list' : 'menu');
    const [selectedStatus, setSelectedStatus] = useState('pending');
    const [selectedJob, setSelectedJob] = useState(null);
    const [switchOpen, setSwitchOpen] = useState(false);
    const [switchBusy, setSwitchBusy] = useState(false);
    const [switchError, setSwitchError] = useState('');
    const switching = useRef(false);
    const cancelSwitchButton = useRef(null);
    const switchTrigger = useRef(null);
    const fromNotifications = new URLSearchParams(window.location.search).get('from') === 'notifications';
    const openedNotificationJob = useRef(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (openedNotificationJob.current || params.get('job') !== 'pending' || !params.get('booking')) return;
        const job = jobs.find(item => String(item.id) === params.get('booking') && item.status === 'pending');
        if (job) {
            openedNotificationJob.current = true;
            setSelectedStatus('pending');
            setJobsSubView('list');
            setSelectedJob(job);
        }
    }, [jobs]);

    const upcoming = nextConfirmedBooking(jobs);
    const bookingSummary = job => `${job.service_type}${job.customer?.name ? ` · ${job.customer.name}` : ''}`;

    useEffect(() => {
        const restoreJobView = event => {
            setSelectedStatus(event.state?.skilllinkJobStatus || 'pending');
            setJobsSubView(event.state?.skilllinkJobStatus ? 'list' : 'menu');
        };
        window.addEventListener('popstate', restoreJobView);
        return () => window.removeEventListener('popstate', restoreJobView);
    }, []);

    // SCHEDULE FORM
    const { data, setData, put, processing } = useForm({
        schedule: (schedule && schedule.length > 0) ? schedule : []
    });

    const updateDay = (index, field, value) => {
        const newSchedule = [...data.schedule];
        newSchedule[index][field] = value;
        setData('schedule', newSchedule);
    };

    const saveSchedule = () => {
        put('/repairer/availability', {
            preserveScroll: true,
            onSuccess: () => alert('Weekly availability saved in SkillLink. This does not create Google Calendar events.')
        });
    };

    // HANDLERS
    const handleOpenChat = (bookingId) => router.visit(`/test-chat/${bookingId}`);
    const handleOpenJobList = (status) => {
        setActiveTab('jobs');
        window.history.pushState({ ...window.history.state, skilllinkMobileNavigation: true, skilllinkJobStatus: status }, '', window.location.href);
        setSelectedStatus(status);
        setJobsSubView('list');
    };
    const handleApproveAndClose = (id) => onApprove(id, () => setSelectedJob(null));
    const handleRejectAndClose = (id) => onReject(id, () => setSelectedJob(null));

    const handleCompleteAndClose = (id) => {
        onComplete(id, () => setSelectedJob(null));
    };

    useEffect(() => {
        if (!switchOpen) return;
        cancelSwitchButton.current?.focus();
        const onKeyDown = event => {
            if (event.key === 'Escape' && !switching.current) {
                setSwitchOpen(false);
                switchTrigger.current?.focus();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [switchOpen]);

    const confirmSwitchToCustomer = async () => {
        if (switching.current) return;
        switching.current = true;
        setSwitchBusy(true);
        setSwitchError('');
        try {
            await onSwitchToCustomer();
            setSwitchOpen(false);
        } catch {
            setSwitchError('Could not switch to your customer account. Please try again.');
        } finally {
            switching.current = false;
            setSwitchBusy(false);
        }
    };

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // --- 3. SUB-COMPONENTS ---

    // FULL SCREEN JOB DETAILS MODAL
    const JobDetailsModal = ({ job, onClose }) => {
        if (!job) return null;

        return (
            <div className="fixed inset-0 z-[9999] sm:flex sm:items-center sm:justify-center">
                <div onClick={onClose} className="hidden sm:block absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>
                <div role="dialog" aria-modal="true" aria-label={job.status === 'pending' ? 'New request' : 'Job details'} className="bg-white w-full h-full sm:h-auto sm:w-[500px] sm:max-h-[90vh] sm:rounded-[30px] relative z-10 shadow-2xl flex flex-col overflow-hidden animate-slide-up">
                    <div className="shrink-0 border-b border-[#e3e8ef] bg-white px-5 py-3">
                        <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-[#0965e8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0965e8]"><FiArrowLeft aria-hidden="true" />Back</button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-5 pb-6 pt-5">
                        <div className="mb-6">
                            <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider mb-2 ${
                                // Status Colors: Pending (Orange/Warm), Completed (Beige), Confirmed (Green/Warm)
                                job.status === 'pending' ? 'bg-orange-50 text-orange-700' : 'bg-[#edf4ff] text-[#172335]'
                            }`}>
                                {job.status === 'pending' ? 'New Request' : job.status}
                            </span>
                            <h2 className="text-3xl font-semibold text-[#172335] leading-none">{job.service_type}</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 bg-[#f4f6f8] rounded-full flex items-center justify-center text-2xl font-semibold text-[#647084] border border-[#e3e8ef]">
                    {job.customer?.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Customer Name</p>
                                    <p className="font-bold text-[#172335] text-xl">{job.customer?.name || 'Client name unavailable'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 flex items-center justify-center text-2xl bg-[#edf4ff] rounded-2xl">📅</div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Schedule</p>
                                    <p className="font-bold text-[#172335] text-lg">
                                        {new Date(job.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </p>
                                    <p className="text-sm text-gray-500 font-medium">
                                        @ {new Date(job.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            {job.service_location && <section aria-label="Booked service location" className="rounded-2xl border border-[#d7e6fb] bg-[#f8fbff] p-3 text-sm">
                                <h3 className="font-semibold text-[#172335]">Booked service address</h3>
                                <p className="mt-1 break-words text-[#365274]">{job.service_location.address || 'Address not saved'}</p>
                                <p className="mt-2 font-semibold text-[#172335]">{job.distance_km == null ? 'Distance unavailable' : `About ${job.distance_km} km between saved pins`}</p>
                                <p className="mt-1 text-xs text-[#647084]">Straight-line distance, not driving distance or live location.</p>
                                {(job.service_location.latitude == null || job.service_location.longitude == null) && <p className="mt-2 text-xs text-[#647084]">Service location pin unavailable.</p>}
                                {(job.provider_location?.latitude == null || job.provider_location?.longitude == null) && <p className="mt-2 text-xs text-[#647084]">Your saved provider pin is unavailable, so distance cannot be calculated.</p>}
                                <div className="mt-3"><BookingLocationsMap serviceLocation={job.service_location} providerLocation={job.provider_location} /></div>
                            </section>}

                            <div className="bg-[#f4f6f8] p-5 rounded-2xl border border-[#e3e8ef]">
                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Issue Description</p>
                                <p className="text-gray-700 font-medium leading-relaxed">
                                    "{job.problem_description || 'No description provided.'}"
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full shrink-0 border-t border-[#e3e8ef] bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:p-4">
                        {actionFeedback?.kind === 'error' && <p role="alert" className="mb-2 rounded-lg bg-red-50 p-2 text-sm text-red-700">{actionFeedback.text}</p>}
                        {job.status === 'pending' ? (
                            <div className="grid grid-cols-[auto_1fr_1fr] gap-2">
                                <button type="button" onClick={onClose} className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#d7e6fb] px-3 py-3 text-sm font-semibold text-[#365274] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0965e8]"><FiArrowLeft aria-hidden="true" />Back</button>
                                <button
                                    type="button" onClick={() => handleRejectAndClose(job.id)} disabled={actionBusy}
                                    className="rounded-xl border-2 border-red-100 px-2 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                                >
                                    Decline
                                </button>
                                <button
                                    type="button" onClick={() => handleApproveAndClose(job.id)} disabled={actionBusy}
                                    // Accept Button -> Dark Brown
                                    className="rounded-xl bg-[#0965e8] px-2 py-3 text-sm font-bold text-white shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                                >
                                    Accept Job
                                </button>
                            </div>
                        ) : job.status === 'confirmed' ? (
                            <div className="grid grid-cols-2 gap-3">
                                 <button
                                    onClick={() => handleOpenChat(job.id)}
                                    // Chat Button -> Beige
                                    className="py-4 rounded-xl bg-[#edf4ff] text-[#172335] font-bold text-lg border border-[#e3e8ef]"
                                >
                                    Chat
                                </button>
                                <button
                                    onClick={() => handleCompleteAndClose(job.id)} disabled={actionBusy}
                                    // Complete Button -> Copper/Greenish
                                    className="py-4 rounded-xl bg-[#0965e8] text-white font-bold text-lg shadow-sm active:scale-95 transition-transform"
                                >
                                    Request Confirmation
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => router.visit(`/bookings/${job.id}`)} className="w-full py-4 rounded-xl bg-[#0965e8] text-white font-bold text-lg">
                                View completion and payment
                            </button>
                        )}
                    </div>

                </div>
            </div>
        );
    };

    // 2. UPDATED JOB CARD
    const JobCard = ({ job }) => (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#e3e8ef] mb-4 animate-fade-in-up relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-bold text-[#172335] text-lg">{job.service_type}{job.customer?.name ? ` · ${job.customer.name}` : ''}</h3>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                        {new Date(job.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                </div>
                <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    job.status === 'pending' ? 'bg-orange-50 text-orange-700' :
                    job.status === 'confirmed' ? 'bg-[#edf4ff] text-[#172335]' :
                    'bg-gray-100 text-gray-600'
                }`}>
                    {job.status}
                </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2 pl-3 border-l-2 border-[#e3e8ef]">
                {job.problem_description || 'No description.'}
            </p>

            <div className="pt-3 border-t border-[#e3e8ef] flex gap-2">
                 <button
                    onClick={() => job.status === 'pending' ? setSelectedJob(job) : router.visit(`/bookings/${job.id}`)}
                    // View Button -> Dark Brown
                    className="flex-1 py-3 bg-[#0965e8] text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                    <span>{job.status === 'pending' ? 'Review request' : 'View booking details'}</span>
                    <span>→</span>
                </button>
            </div>
        </div>
    );

    // --- VIEWS ---
    const JobsMenu = () => <div className="px-4 pb-24 pt-4">
        <button type="button" onClick={() => backTo('home')} className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[#0965e8]"><FiArrowLeft aria-hidden="true" />Home</button>
        <h2 className="mb-4 text-lg font-semibold text-[#172335]">Jobs</h2>
        <div className="grid gap-2">
            {[
                ['Pending Requests', jobCounts.pending, 'pending'],
                ['Accepted/Active', jobCounts.active, 'confirmed'],
                ['Completed Jobs', jobCounts.completed, 'completed'],
            ].map(([label, count, status]) => <button type="button" key={status} onClick={() => handleOpenJobList(status)} className="flex w-full items-center justify-between rounded-2xl border border-[#e3e8ef] bg-white p-4 text-left"><span className="text-sm font-semibold text-[#172335]">{label}</span><span className="rounded-full bg-[#edf4ff] px-3 py-1 text-sm font-semibold text-[#0965e8]">{count}</span></button>)}
        </div>
        <button type="button" onClick={() => setActiveTab('schedule')} className="mt-4 w-full rounded-xl border border-[#d7e6fb] bg-white px-3 py-3 text-sm font-semibold text-[#0965e8]">View Schedule</button>
    </div>;

    const HomeView = () => <div className="px-4 pb-24 pt-3">
        <h1 className="mb-3 text-xl font-semibold text-[#172335]">Home</h1>
        {upcoming ? <button type="button" onClick={() => router.visit(`/bookings/${upcoming.id}`)} className="mb-4 w-full rounded-2xl border border-[#d7e6fb] bg-[#edf4ff] p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0965e8]">
            <span className="block text-xs font-semibold text-[#0965e8]">Next confirmed booking</span>
            <strong className="mt-1 block text-base leading-snug text-[#172335]">{bookingSummary(upcoming)}</strong>
            <span className="mt-1 block text-sm text-[#365274]">{formatManilaSchedule(upcoming.scheduled_at)}</span>
            <span className="mt-2 block text-sm font-semibold text-[#0965e8] underline underline-offset-2">View Booking Details →</span>
        </button> : <p className="mb-4 rounded-2xl border border-[#e3e8ef] bg-white p-4 text-sm text-[#647084]">No upcoming confirmed booking.</p>}
        <div className="grid grid-cols-2 gap-3">
            {[
                ['Jobs', FiBriefcase, () => { setJobsSubView('menu'); setActiveTab('jobs'); }],
                ['Pending Requests', FiBriefcase, () => handleOpenJobList('pending')],
                ['Messages', FiMessageCircle, () => setActiveTab('chats')],
                ['Edit Service Profile', FiEdit2, () => router.visit('/settings?section=provider-profile&from=home')],
            ].map(([label, Icon, action]) => <button key={label} type="button" onClick={action} className="flex h-[118px] flex-col items-start justify-center gap-3 rounded-2xl border border-[#e3e8ef] bg-white p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0965e8]"><Icon className="text-[30px] text-[#0965e8]" aria-hidden="true" /><strong className="text-[15px] font-semibold leading-snug text-[#172335]">{label}</strong></button>)}
        </div>
        {!(profile?.service_areas || []).length && <p className="mt-4 rounded-xl border border-[#d7e6fb] bg-[#edf4ff] p-3 text-xs text-[#365274]">Choose the pilot areas you serve in Edit Service Profile to appear in client suggestions.</p>}
    </div>;

    const JobsList = () => {
        const filteredJobs = jobs.filter(j => selectedStatus === 'confirmed'
            ? ['confirmed', 'in_progress', 'completion_requested', 'completion_disputed'].includes(j.status)
            : j.status === selectedStatus).sort((a, b) => selectedStatus === 'completed'
                ? new Date(b.updated_at || b.scheduled_at) - new Date(a.updated_at || a.scheduled_at)
                : new Date(a.scheduled_at) - new Date(b.scheduled_at));
        let title = 'Pending Requests';
        if (selectedStatus === 'confirmed') title = 'Active Jobs';
        if (selectedStatus === 'completed') title = 'Job History';

        return (
            <div className="px-4 pb-24 pt-2 animate-fade-in-right">
                {fromNotifications && <button type="button" onClick={() => router.visit('/app?tab=notifications')} className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[#0965e8]"><FiArrowLeft aria-hidden="true" />Notifications</button>}
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => window.history.state?.skilllinkJobStatus ? window.history.back() : setJobsSubView('menu')} className="h-10 w-10 bg-white border border-gray-200 rounded-full shadow-sm active:bg-gray-100 flex items-center justify-center font-bold text-lg text-[#172335]" aria-label="Back to Jobs">←</button>
                    <h2 className="text-2xl font-semibold text-[#172335]">{title}</h2>
                </div>
                {filteredJobs.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <div className="text-6xl mb-4">📂</div>
                        <p className="font-bold text-gray-400">No jobs found.</p>
                    </div>
                ) : (
                    filteredJobs.map(job => <JobCard key={job.id} job={job} />)
                )}
            </div>
        );
    };

    const ChatsView = () => (
        <div className="px-4 pb-24 pt-4 text-gray-400 font-bold">
            <h2 className="mb-4 text-lg font-semibold text-[#172335]">Messages</h2>
            {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="bg-[#edf4ff] p-6 rounded-full mb-4"><span className="text-4xl">💬</span></div>
                    <h3 className="font-bold text-[#172335]">No active chats</h3>
                    <p className="text-sm text-gray-500 max-w-[200px]">Messages from customers will appear here.</p>
                </div>
            ) : (
                conversations.map(chat => (
                    <div key={chat.id} onClick={() => handleOpenChat(chat.booking_id)} className="bg-white p-4 rounded-2xl shadow-sm border border-[#e3e8ef] flex items-center gap-4 active:scale-95 transition-transform mb-3 relative">

                        <div className="h-14 w-14 bg-[#f4f6f8] rounded-full overflow-hidden border border-[#e3e8ef] flex-shrink-0">
                            <img src={`https://ui-avatars.com/api/?name=${chat.other_user_name}&background=random`} className="h-full w-full object-cover" />
                        </div>

                        <div className="flex-1 min-w-0 text-left">
                            <div className="flex justify-between items-baseline mb-1">
                                <h3 className="font-bold text-[#172335] truncate">{chat.other_user_name}</h3>
                                {chat.last_message_time && <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{chat.last_message_time}</span>}
                            </div>

                            <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#edf4ff] text-[#172335] text-[10px] font-bold mb-1.5 border border-[#e3e8ef] max-w-full truncate">
                                Job #{chat.booking_id} • {chat.service_type || 'Service'}
                            </div>

                            <p className="text-sm text-gray-500 truncate block">
                                {chat.last_message_content ?? 'No messages yet'}
                            </p>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const ScheduleView = () => (
        <div className="px-4 pb-24 pt-4">
            <div className="mb-4 rounded-xl border border-[#e3e8ef] bg-white p-4">
                <h3 className="font-bold text-[#172335]">Google Calendar (optional)</h3>
                <p className="mt-1 text-sm text-gray-600">Weekly availability stays in SkillLink. Accepted bookings can be added to your Google Calendar after you connect it.</p>
                {isGoogleConnected ? <p className="mt-3 text-sm font-semibold text-green-700">Calendar connected</p> : <a href="/auth/calendar/connect" className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-[#0965e8] px-4 text-sm font-semibold text-white">Connect Google Calendar</a>}
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e3e8ef]">
                <h3 className="font-bold text-lg mb-4 text-[#172335]">Weekly Availability</h3>
                {data.schedule.map((day, index) => (
                    <div key={day.day_of_week} className="flex items-center justify-between py-3 border-b border-[#e3e8ef] last:border-0">
                        <div className="flex items-center gap-3">
                            {/* Checkbox color -> Brown/Black */}
                            <input type="checkbox" checked={day.is_active} onChange={(e) => updateDay(index, 'is_active', e.target.checked)} className="w-5 h-5 rounded text-[#172335] focus:ring-[#0965e8] border-gray-300"/>
                            <span className={`font-bold ${day.is_active ? 'text-[#172335]' : 'text-gray-300'}`}>{DAYS[day.day_of_week]}</span>
                        </div>
                        {day.is_active && (
                            <div className="flex items-center gap-1">
                                <input type="time" value={day.start_time} onChange={(e) => updateDay(index, 'start_time', e.target.value)} className="w-[104px] text-xs p-1 border rounded bg-[#f4f6f8]"/>
                                <span className="text-gray-300">-</span>
                                <input type="time" value={day.end_time} onChange={(e) => updateDay(index, 'end_time', e.target.value)} className="w-[104px] text-xs p-1 border rounded bg-[#f4f6f8]"/>
                            </div>
                        )}
                    </div>
                ))}
                {/* Save Button -> Dark Brown */}
                <button onClick={saveSchedule} disabled={processing} className="w-full mt-4 bg-[#0965e8] text-white py-3 rounded-xl font-bold hover:bg-[#0753be] transition-colors">
                    {processing ? 'Saving...' : 'Update Schedule'}
                </button>
            </div>
        </div>
    );

    // --- MAIN RENDER ---
    return (
        <div className="skilllink-screen min-h-screen bg-[#f4f6f8] font-sans">
            <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} />

            {/* TOP HEADER */}
            {activeTab === 'settings' ? <header className="sticky top-0 z-10 bg-white px-4 py-4"><h1 className="text-xl font-semibold text-[#172335]">Settings</h1></header> : <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0965e8] text-sm font-bold text-white" aria-label="SkillLink">S</div>
                <button type="button" onClick={() => router.visit(`/settings?section=provider-profile&from=${activeTab === 'notifications' ? 'notifications' : 'home'}`)} aria-label="Open provider profile" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d7e6fb] bg-[#edf4ff] text-sm font-bold text-[#0965e8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0965e8]">{(user?.name || profile?.business_name || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('')}</button>
            </header>}

            {/* CONTENT AREA */}
            <main className={activeTab === 'home' ? '' : 'pt-2'}>
                {actionFeedback && !selectedJob && <p role={actionFeedback.kind === 'error' ? 'alert' : 'status'} className={`mx-4 rounded-xl p-3 text-sm ${actionFeedback.kind === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>{actionFeedback.text}</p>}
                {activeTab === 'home' && <HomeView />}
                {activeTab === 'jobs' && (jobsSubView === 'menu' ? <JobsMenu /> : <JobsList />)}
                {activeTab === 'chats' && <ChatsView />}
                {activeTab === 'schedule' && <ScheduleView />}
                {activeTab === 'notifications' && <div className="px-4 pb-24 pt-4"><h1 className="mb-4 text-xl font-semibold text-[#172335]">Notifications</h1><NotificationsView notifications={notifications} onOpen={onOpenNotification} /></div>}

                {activeTab === 'settings' && (
                    <div className="px-4 pb-24 pt-4">
                            <div className="overflow-hidden rounded-2xl border border-[#e3e8ef] bg-white">
                                <Link href="/settings?section=provider-profile&from=settings" className="flex items-center gap-3 border-b border-[#e3e8ef] p-4"><span className="rounded-xl bg-[#edf4ff] p-2.5 text-[#0965e8]"><FiUser aria-hidden="true" /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-[#172335]">Profile</strong><small className="block text-xs text-[#647084]">Edit service and location details</small></span><FiChevronRight className="text-[#94a3b8]" aria-hidden="true" /></Link>
                                <Link href="/provider/tesda-qualifications" className="flex items-center gap-3 border-b border-[#e3e8ef] p-4"><span className="rounded-xl bg-[#edf4ff] p-2.5 text-[#0965e8]"><FiFileText aria-hidden="true" /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-[#172335]">TESDA Qualifications</strong><small className="block text-xs text-[#647084]">Submissions and AI screening</small></span><FiChevronRight className="text-[#94a3b8]" aria-hidden="true" /></Link>
                                <Link href="/settings?section=payment" className="flex items-center gap-3 border-b border-[#e3e8ef] p-4"><span className="rounded-xl bg-[#edf4ff] p-2.5 text-[#0965e8]"><FiCreditCard aria-hidden="true" /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-[#172335]">Payment</strong><small className="block text-xs text-[#647084]">Manage your GCash QR image</small></span><FiChevronRight className="text-[#94a3b8]" aria-hidden="true" /></Link>
                                <button ref={switchTrigger} type="button" onClick={() => { setSwitchError(''); setSwitchOpen(true); }} className="flex w-full items-center gap-3 border-b border-[#e3e8ef] p-4 text-left"><span className="rounded-xl bg-[#edf4ff] p-2.5 text-[#0965e8]"><FiUser aria-hidden="true" /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-[#172335]">Switch to Customer</strong><small className="block text-xs text-[#647084]">Use your customer account</small></span><FiChevronRight className="text-[#94a3b8]" aria-hidden="true" /></button>
                                <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 p-4 text-left"><span className="rounded-xl bg-red-50 p-2.5 text-red-700"><FiLogOut aria-hidden="true" /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-red-700">Log Out</strong><small className="block text-xs text-[#647084]">End this session</small></span><FiChevronRight className="text-[#94a3b8]" aria-hidden="true" /></button>
                            </div>
                    </div>
                )}
            </main>

            {switchOpen && <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"><div role="dialog" aria-modal="true" aria-labelledby="switch-customer-title" aria-describedby="switch-customer-description" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"><h2 id="switch-customer-title" className="text-lg font-semibold text-[#172335]">Switch to customer?</h2><p id="switch-customer-description" className="mt-2 text-sm leading-relaxed text-[#647084]">You’ll return to your customer account. You can switch back to provider mode later.</p>{switchError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{switchError}</p>}<div className="mt-6 flex gap-3"><button ref={cancelSwitchButton} type="button" disabled={switchBusy} onClick={() => { setSwitchOpen(false); switchTrigger.current?.focus(); }} className="flex-1 rounded-xl border border-[#d7e6fb] px-4 py-3 text-sm font-semibold text-[#365274] disabled:opacity-50">Cancel</button><button type="button" disabled={switchBusy} onClick={confirmSwitchToCustomer} className="flex-1 rounded-xl bg-[#0965e8] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{switchBusy ? 'Switching…' : 'Switch to Customer'}</button></div></div></div>}

            {/* BOTTOM NAV BAR */}
            <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 py-3 px-5 flex justify-between items-center pb-[max(12px,env(safe-area-inset-bottom))] z-20">
                <NavButton icon={<FiHome />} label="Home" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
                <NavButton icon={<FiBell />} label="Notifications" isActive={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} badge={unreadNotificationsCount} />
                <NavButton icon={<FiSettings />} label="Settings" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            </nav>
        </div>
    );
}

// Updated NavButton to use the Brown theme
const NavButton = ({ icon, label, isActive, onClick, badge }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1 relative w-16">
        <span className={`text-xl transition-transform ${isActive ? 'scale-110 text-[#0965e8]' : 'opacity-50 grayscale'}`}>{icon}</span>
        <span className={`text-[10px] font-bold ${isActive ? 'text-[#0965e8]' : 'text-gray-400'}`}>{label}</span>
        {badge > 0 && (
            <span className="absolute -top-1 right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {badge}
            </span>
        )}
    </button>
);
