import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import RepairerMobile from './RepairerMobile';
import RepairerDesktop from './RepairerDesktop';

export default function RepairerDashboard({ 
    user, 
    profile, 
    jobs: initialJobs, 
    schedule,
    isGoogleConnected,
    onSwitchToCustomer,
    conversations = [],
    notifications = [],
    unreadNotificationsCount = 0,
    jobCounts = { pending: 0, active: 0, completed: 0 },
    onOpenNotification,
}) {
    const { flash } = usePage().props;
    const [jobs, setJobs] = useState(initialJobs);
    const [actionBusy, setActionBusy] = useState(false);
    const [actionFeedback, setActionFeedback] = useState(null);
    useEffect(() => {
        if (!actionFeedback || actionFeedback.kind !== 'success') return;
        const timer = window.setTimeout(() => setActionFeedback(null), 5000);
        return () => window.clearTimeout(timer);
    }, [actionFeedback]);

    useEffect(() => {
        setJobs(initialJobs);
    }, [initialJobs]);

    // 1. APPROVE HANDLER
    const submitJobAction = (id, action, question, fallback, onSaved) => {
        if (actionBusy || !confirm(question)) return;
        setActionBusy(true);
        setActionFeedback(null);
        router.post(`/bookings/${id}/${action}`, {}, {
            preserveScroll: true,
            onSuccess: page => {
                const flash = page.props.flash;
                setActionFeedback({ kind: flash?.error ? 'error' : 'success', text: flash?.error ? `${flash.message || fallback} ${flash.error}` : flash?.message || fallback });
                onSaved?.();
            },
            onError: errors => setActionFeedback({ kind: 'error', text: Object.values(errors)[0] || 'Please try again.' }),
            onFinish: () => setActionBusy(false),
        });
    };
    const handleApprove = (id, onSaved) => submitJobAction(id, 'approve', 'Accept this job? Google Calendar sync is optional.', 'Job accepted.', onSaved);

    // 2. REJECT HANDLER
    const handleReject = (id, onSaved) => submitJobAction(id, 'reject', 'Are you sure you want to decline this request?', 'Request declined.', onSaved);

    const handleComplete = (id, onSaved) => submitJobAction(id, 'complete', 'Request client confirmation that the work is finished?', 'Client confirmation requested.', onSaved);

    const refreshJobs = () => {
        router.reload({ only: ['jobs'] });
    };

    const handleLogout = () => {
        router.post('/logout'); 
    };

    return (
        <>
            <Head title="Work Dashboard" />
            {!actionFeedback && (flash?.message || flash?.error) && <p role={flash?.error ? 'alert' : 'status'} className={`mx-auto max-w-5xl rounded-xl p-3 text-sm ${flash?.error ? 'bg-amber-50 text-amber-900' : 'bg-green-50 text-green-800'}`}>{flash?.error || flash?.message}</p>}

            {/* 1. MOBILE VIEW */}
            <div className="block md:hidden">
                <RepairerMobile 
                    user={user} 
                    profile={profile} 
                    jobs={jobs}
                    schedule={schedule}
                    isGoogleConnected={isGoogleConnected}
                    conversations={conversations}
                    notifications={notifications}
                    unreadNotificationsCount={unreadNotificationsCount}
                    jobCounts={jobCounts}
                    onOpenNotification={onOpenNotification}
                    
                    onSwitchToCustomer={onSwitchToCustomer}
                    onApprove={handleApprove} 
                    onReject={handleReject}
                    onComplete={handleComplete} 
                    actionBusy={actionBusy}
                    actionFeedback={actionFeedback}
                    onRefresh={refreshJobs}
                    onLogout={handleLogout} 
                />
            </div>

            {/* 2. DESKTOP VIEW */}
            <div className="hidden md:block">
                {actionFeedback && <p role={actionFeedback.kind === 'error' ? 'alert' : 'status'} className={`mx-auto max-w-5xl rounded-xl p-3 text-sm ${actionFeedback.kind === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>{actionFeedback.text}</p>}
                <RepairerDesktop 
                    user={user} 
                    profile={profile} 
                    jobs={jobs} 
                    schedule={schedule} 
                    isGoogleConnected={isGoogleConnected}
                    conversations={conversations}
                    
                    onSwitchToCustomer={onSwitchToCustomer}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onLogout={handleLogout} 
                    onComplete={handleComplete}
                />
            </div>
        </>
    );
}
