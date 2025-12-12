import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import RepairerMobile from './RepairerMobile';
import RepairerDesktop from './RepairerDesktop'; // You'll create this next

export default function RepairerDashboard({ 
    user, 
    profile, 
    jobs: initialJobs, // Rename incoming prop to avoid conflict with state
    schedule,
    isGoogleConnected,
    onSwitchToCustomer 
}) {
    
    // Initialize state with the REAL data from Laravel
    const [jobs, setJobs] = useState(initialJobs);

    // Sync state if props change (e.g. after a re-visit)
    useEffect(() => {
        setJobs(initialJobs);
    }, [initialJobs]);

    // --- SHARED LOGIC (The Brain) ---
    
    // We don't need handleAccept here because RepairerMobile 
    // now calls the backend directly via router.post().
    // But if you want to update the UI instantly (Optimistic UI), you can:
    const refreshJobs = () => {
        // Inertia automatically refreshes props on navigation, 
        // but we can manually trigger a reload if needed.
        router.reload({ only: ['jobs'] });
    };

    // --- RENDER ---
    return (
        <>
            <Head title="Work Dashboard" />

            {/* 1. MOBILE VIEW (< 768px) */}
            <div className="block md:hidden">
                <RepairerMobile 
                    user={user} 
                    profile={profile} 
                    jobs={jobs}
                    schedule={schedule}
                    isGoogleConnected={isGoogleConnected}
                    onSwitchToCustomer={onSwitchToCustomer}
                    // Pass the refresh function if child needs to trigger a reload
                    onRefresh={refreshJobs}
                />
            </div>

            {/* 2. DESKTOP VIEW (>= 768px) */}
            <div className="hidden md:block">
                <RepairerDesktop 
                    user={user} 
                    profile={profile} 
                    jobs={jobs} 
                    schedule={schedule}
                    isGoogleConnected={isGoogleConnected}
                    onSwitchToCustomer={onSwitchToCustomer}
                />
            </div>
        </>
    );
}