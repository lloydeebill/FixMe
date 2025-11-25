import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import RepairerMobile from './RepairerMobile';
import RepairerDesktop from './RepairerDesktop';

export default function RepairerDashboard({ user, profile, onSwitchToCustomer }) {
    
    // --- MOCK DATA (We will replace this with real database data later) ---
    const [jobs, setJobs] = useState([
        { 
            id: 101, 
            customer: "Juan dela Cruz", 
            type: "Electrical", 
            desc: "Outlet sparking when plugging in TV", 
            location: "Davao City, Poblacion", 
            distance: "2.5 km",
            status: "pending", 
            price: "₱500 est."
        },
        { 
            id: 102, 
            customer: "Maria Clara", 
            type: "Plumbing", 
            desc: "Kitchen sink leaking badly", 
            location: "Matina, Davao", 
            distance: "5.1 km",
            status: "pending",
            price: "₱850 est."
        },
    ]);

    const [earnings, setEarnings] = useState(12500); 

    // --- SHARED LOGIC ---
    const handleAcceptJob = (jobId) => {
        // Optimistic UI Update: Move to 'accepted' status immediately
        setJobs(jobs.map(job => 
            job.id === jobId ? { ...job, status: 'accepted' } : job
        ));
        alert("Job Accepted! (Simulated)");
    };

    const handleDeclineJob = (jobId) => {
        if(confirm("Are you sure you want to decline this job?")) {
            setJobs(jobs.filter(job => job.id !== jobId));
        }
    };

    const handleGoOnline = (isOnline) => {
        console.log("User is now:", isOnline ? "Online" : "Offline");
    };

    // --- RENDER ---
    return (
        <>
            <Head title="Work Dashboard" />

            {/* 1. MOBILE VIEW (Visible on small screens) */}
            <div className="block md:hidden">
                <RepairerMobile 
                    user={user} 
                    profile={profile} 
                    jobs={jobs}
                    earnings={earnings}
                    onAccept={handleAcceptJob}
                    onDecline={handleDeclineJob}
                    onToggleStatus={handleGoOnline}
                    onSwitchToCustomer={onSwitchToCustomer}
                />
            </div>

            {/* 2. DESKTOP VIEW (Visible on medium+ screens) */}
            <div className="hidden md:block">
                <RepairerDesktop 
                    user={user} 
                    profile={profile} 
                    jobs={jobs} 
                    earnings={earnings}
                    onAccept={handleAcceptJob}
                    onDecline={handleDeclineJob}
                    onToggleStatus={handleGoOnline}
                    onSwitchToCustomer={onSwitchToCustomer}
                />
            </div>
        </>
    );
}