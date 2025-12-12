import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react'; 
import MobileDashboard from './Dashboard/MobileDashboard'; 
import DesktopDashboard from './Dashboard/DesktopDashboard';
import BookingModal from '../Components/BookingModal';
import RepairerDashboard from './Dashboard/Repairer/RepairerDashboard';

// 1. Accept ALL props from the Laravel Controller (Added jobs, schedule, etc.)
export default function Dashboard({ 
    auth, 
    isRepairer, 
    profile, 
    appointment, 
    quickAccess, 
    history, 
    topServices,
    // --- NEW PROPS FROM CONTROLLER ---
    jobs = [], 
    schedule = [],
    isGoogleConnected = false
}) {
    
    const user = auth.user;

    // --- STATE ---
    const [isWorkMode, setIsWorkMode] = useState(isRepairer);
    const [selectedRepairer, setSelectedRepairer] = useState(null);

    // --- HANDLERS ---
    const handleRepairerSelect = (repairer) => {
        setSelectedRepairer(repairer); 
    };

    const handleCloseModal = () => {
        setSelectedRepairer(null); 
    };

    const handleBookingConfirm = (bookingDetails) => {
        if (!selectedRepairer) return;

        router.post('/bookings', {
            repairer_id: selectedRepairer.id,
            service_type: selectedRepairer.role,
            scheduled_at: `${bookingDetails.date} ${bookingDetails.time}`, 
            problem_description: bookingDetails.notes || 'No details provided', 
        }, {
            onSuccess: () => setSelectedRepairer(null),
        });
    };

    // --- SHARED DATA BUNDLE ---
    const sharedProps = {
        user: user,
        appointment: appointment,
        quickAccess: quickAccess,
        history: history,
        topServices: topServices, 
        onRepairerSelect: handleRepairerSelect, 
        onSwitchToWork: () => setIsWorkMode(true) 
    };

    // --- RENDER ---

    // A. Repairer View
    if (isWorkMode) {
        return (
            <RepairerDashboard 
                user={user} 
                profile={profile}
                // --- PASS THE MISSING DATA DOWN ---
                jobs={jobs}              // <--- This was missing!
                schedule={schedule}      // <--- This was missing!
                isGoogleConnected={isGoogleConnected}
                // ----------------------------------
                onSwitchToCustomer={() => setIsWorkMode(false)} 
            />
        );
    }

    // B. Customer View
    return (
        <>
            <Head title="Dashboard" />

            {/* Mobile View */}
            <div className="block md:hidden">
                <MobileDashboard {...sharedProps} />
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
                <DesktopDashboard {...sharedProps} />
            </div>
            
            {/* Modal Layer */}
            <BookingModal 
                repairer={selectedRepairer} 
                onClose={handleCloseModal}
                onConfirm={handleBookingConfirm}
            />
        </>
    );
}