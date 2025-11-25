import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import MobileDashboard from './Dashboard/MobileDashboard'; 
import DesktopDashboard from './Dashboard/DesktopDashboard';


export default function Dashboard() {
    // Fetch user data from Inertia props
    const { auth } = usePage().props;
    const user = auth.user;

    // --- SHARED DATA (The source of truth for all views) ---
    const upcomingAppointment = {
        day: '16',
        month: 'Aug',
        time: '14:30',
        repairer: 'Donald Johnson',
        type: 'Plumbing Fix', // Example detail
        link: 'meet.google.com/tfg-jset-wjk',
        exists: true // Flag to show the card
    };

    const quickAccessItems = [
        { 
            name: 'Electrical', 
            color: 'bg-yellow-100', 
            textColor: 'text-yellow-700',
            iconType: 'electrical' 
        },
        { 
            name: 'Carpentry', 
            color: 'bg-orange-100', 
            textColor: 'text-orange-700',
            iconType: 'carpentry'
        },
        { 
            name: 'Seamstress', 
            color: 'bg-purple-100', 
            textColor: 'text-purple-700',
            iconType: 'seamstress'
        },
    ];

    const historySummary = {
        lastJob: 'Door Repair',
        count: 5
    };
    
    // --- Data to pass to children ---
    const sharedProps = {
        user: user,
        appointment: upcomingAppointment,
        quickAccess: quickAccessItems,
        history: historySummary,
    };

    return (
        <>
            <Head title="Dashboard" />

            {/* 1. MOBILE VIEW (Visible on small screens, hidden on medium+) */}
            <div className="block md:hidden">
                <MobileDashboard {...sharedProps} />
            </div>

            {/* 2. DESKTOP VIEW (Hidden on small screens, visible on medium+) */}
            <div className="hidden md:block">
                <DesktopDashboard {...sharedProps} />
            </div>
        </>
    );
}