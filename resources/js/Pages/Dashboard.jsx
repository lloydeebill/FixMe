import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react'; // Use router for manual visits if needed
import MobileDashboard from './Dashboard/MobileDashboard'; 
import DesktopDashboard from './Dashboard/DesktopDashboard';
import BookingModal from '../Components/BookingModal';
import RepairerDashboard from './Dashboard/Repairer/RepairerDashboard';

// 1. Accept ALL props from the Laravel Controller
export default function Dashboard({ auth, isRepairer, profile, appointment, quickAccess, history, topServices }) {
    
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

        // Post to the BookingController
        router.post('/bookings', {
            repairer_id: selectedRepairer.id,
            service_type: selectedRepairer.role,
            scheduled_at: `${bookingDetails.date} ${bookingDetails.time}`, 
            
            // 🛑 FIX: Rename 'notes' to 'problem_description'
            problem_description: bookingDetails.notes || 'No details provided', 
        }, {
            onSuccess: () => setSelectedRepairer(null),
        });
    };

    // --- SHARED DATA BUNDLE ---
    // We wrap all data in one object to pass it easily
    const sharedProps = {
        user: user,
        appointment: appointment,
        quickAccess: quickAccess,
        history: history,
        topServices: topServices, // <--- 2. Passing the DB data down
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