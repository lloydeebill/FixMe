import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import RepairerMobile from './RepairerMobile';
import RepairerDesktop from './RepairerDesktop';

export default function RepairerDashboard({ 
    user, 
    profile, 
    jobs: initialJobs, 
    schedule,
    isGoogleConnected,
    onSwitchToCustomer,
    conversations = [] 
}) {
    const [jobs, setJobs] = useState(initialJobs);

    useEffect(() => {
        setJobs(initialJobs);
    }, [initialJobs]);

    // 1. APPROVE HANDLER
    const handleApprove = (id) => {
        if (confirm("Accept this job and sync to Google Calendar?")) {
            router.post(`/bookings/${id}/approve`, {}, {
                onSuccess: () => alert("Job Accepted & Synced!"),
                onError: () => alert("Something went wrong.")
            });
        }
    };

    // 2. REJECT HANDLER
    const handleReject = (id) => {
        if (confirm('Are you sure you want to decline this request?')) {
            router.post(`/bookings/${id}/reject`, {}, {
                onSuccess: () => alert("Request declined."),
                onError: () => alert("Something went wrong.")
            });
        }
    };

    // 3. 🆕 COMPLETE HANDLER (Add this!)
    const handleComplete = (id) => {
        if (confirm("Are you sure you want to mark this job as completed?")) {
            // Note: This hits the 'complete' method we added to BookingController
            router.post(`/bookings/${id}/complete`, {}, {
                onSuccess: () => alert("Great work! Job moved to history."),
                onError: () => alert("Could not complete job.")
            });
        }
    };

    const refreshJobs = () => {
        router.reload({ only: ['jobs'] });
    };

    const handleLogout = () => {
        router.post('/logout'); 
    };

    return (
        <>
            <Head title="Work Dashboard" />

            {/* 1. MOBILE VIEW */}
            <div className="block md:hidden">
                <RepairerMobile 
                    user={user} 
                    profile={profile} 
                    jobs={jobs}
                    schedule={schedule}
                    isGoogleConnected={isGoogleConnected}
                    conversations={conversations}
                    
                    onSwitchToCustomer={onSwitchToCustomer}
                    onApprove={handleApprove} 
                    onReject={handleReject}
                    onComplete={handleComplete} 
                    onRefresh={refreshJobs}
                    onLogout={handleLogout} 
                />
            </div>

            {/* 2. DESKTOP VIEW */}
            <div className="hidden md:block">
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