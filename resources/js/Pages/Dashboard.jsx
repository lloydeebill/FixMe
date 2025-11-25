import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import MobileDashboard from './Dashboard/MobileDashboard'; 
import DesktopDashboard from './Dashboard/DesktopDashboard';
import BookingModal from '../Components/BookingModal';
import RepairerDashboard from './Dashboard/Repairer/RepairerDashboard';

export default function Dashboard({ isRepairer, profile }) {
    
    const { auth } = usePage().props;
    const user = auth.user;

    // 🌟 NEW STATE: This controls the View Mode
    // If I am a repairer, start in Work Mode. If not, start in Customer Mode.
    const [isWorkMode, setIsWorkMode] = useState(isRepairer);

    // --- STATE MANAGEMENT ---
    const [selectedRepairer, setSelectedRepairer] = useState(null);

    // --- ACTIONS ---
    const handleRepairerSelect = (repairer) => {
        setSelectedRepairer(repairer); 
    };

    const handleCloseModal = () => {
        setSelectedRepairer(null); 
    };

    const handleBookingConfirm = (bookingDetails) => {
        console.log("Booking Confirmed:", bookingDetails);
        setSelectedRepairer(null); 
    };

    // --- SHARED DATA ---
    const upcomingAppointment = {
        day: '16', month: 'Aug', time: '14:30',
        repairer: 'Donald Johnson', type: 'Plumbing Fix',
        link: 'meet.google.com/tfg-jset-wjk', exists: true
    };

    const quickAccessItems = [
        { name: 'Electrical', color: 'bg-yellow-100', textColor: 'text-yellow-700', iconType: 'electrical' },
        { name: 'Carpentry', color: 'bg-orange-100', textColor: 'text-orange-700', iconType: 'carpentry' },
        { name: 'Seamstress', color: 'bg-purple-100', textColor: 'text-purple-700', iconType: 'seamstress' },
    ];

    const historySummary = { lastJob: 'Door Repair', count: 5 };
    
    const sharedProps = {
        user: user,
        appointment: upcomingAppointment,
        quickAccess: quickAccessItems,
        history: historySummary,
        onRepairerSelect: handleRepairerSelect,
        // Optional: Pass a function to let customers switch to work mode
        onSwitchToWork: () => setIsWorkMode(true) 
    };

    // ---------------------------------------------------------
    // 🚦 THE TRAFFIC CONTROLLER
    // ---------------------------------------------------------

    // 1. IF WORK MODE IS ON -> Show Repairer Dashboard
    if (isWorkMode) {
        return (
            <RepairerDashboard 
                user={user} 
                profile={profile}
                // 👇 We pass this function down so they can switch back
                onSwitchToCustomer={() => setIsWorkMode(false)} 
            />
        );
    }

    // 2. IF WORK MODE IS OFF -> Show Customer Dashboard
    return (
        <>
            <Head title="Dashboard" />

            <div className="block md:hidden">
                <MobileDashboard {...sharedProps} />
            </div>

            <div className="hidden md:block">
                <DesktopDashboard {...sharedProps} />
            </div>
            
            {/* If they are a repairer but currently in Customer Mode, show a floating button to switch back */}
            {isRepairer && !isWorkMode && (
                <button 
                    onClick={() => setIsWorkMode(true)}
                    className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-xl hover:bg-green-700 transition z-50 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Switch to Work Mode
                </button>
            )}

            <BookingModal 
                repairer={selectedRepairer} 
                onClose={handleCloseModal}
                onConfirm={handleBookingConfirm}
            />
        </>
    );
}