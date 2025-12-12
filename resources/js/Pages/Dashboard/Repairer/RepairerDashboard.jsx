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
    onSwitchToCustomer 
}) {
    const [jobs, setJobs] = useState(initialJobs);

    useEffect(() => {
        setJobs(initialJobs);
    }, [initialJobs]);

    // --- SHARED ACTIONS (Defined Once!) ---
    
    const handleApprove = (id) => {
        if (confirm("Accept this job and sync to Google Calendar?")) {
            router.post(`/bookings/${id}/approve`, {}, {
                onSuccess: () => alert("Job Accepted & Synced!"),
                onError: () => alert("Something went wrong.")
            });
        }
    };

    const handleReject = (id) => {
        if (confirm('Are you sure you want to decline this request?')) {
            router.post(`/bookings/${id}/reject`, {}, {
                onSuccess: () => alert("Request declined."),
                onError: () => alert("Something went wrong.")
            });
        }
    };

    const refreshJobs = () => {
        router.reload({ only: ['jobs'] });
    };

    const handleLogout = () => {
        router.post('/logout'); 
    };
    // --- RENDER ---
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
                    onSwitchToCustomer={onSwitchToCustomer}
                    onApprove={handleApprove} 
                    onReject={handleReject}
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
                    onSwitchToCustomer={onSwitchToCustomer}
                    // 👇 PASSING THE SHARED ACTIONS DOWN
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onLogout={handleLogout} 

                />
            </div>
        </>
    );
}