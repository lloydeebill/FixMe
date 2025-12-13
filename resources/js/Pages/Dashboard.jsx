import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react'; 
import MobileDashboard from './Dashboard/MobileDashboard'; 
import DesktopDashboard from './Dashboard/DesktopDashboard';
import BookingModal from '../Components/BookingModal';
import RepairerDashboard from './Dashboard/Repairer/RepairerDashboard';

export default function Dashboard({ 
    auth, 
    isRepairer, 
    profile, 
    appointment, 
    quickAccess, 
    history, 
    topServices,
    jobs = [], 
    schedule = [],
    isGoogleConnected = false
}) {
    
    const user = auth.user;

    // --- STATE ---
    const [isWorkMode, setIsWorkMode] = useState(isRepairer); // Default to work mode if they logged in as repairer context
    const [selectedRepairer, setSelectedRepairer] = useState(null);

    // --- HANDLERS ---
    
    // 🛑 THE NEW SMART SWITCH LOGIC
    const handleSwitchToWorkMode = () => {
        if (isRepairer) {
            // Case A: They are already a pro -> Show the Dashboard
            setIsWorkMode(true);
        } else {
            // Case B: They are just a customer -> Go to Registration Page
            // This matches your web.php route: name('repairer.create')
            router.get('/become-repairer');
        }
    };

    const handleRepairerSelect = (repairer) => {
        setSelectedRepairer(repairer); 
    };

    const handleCloseModal = () => {
        setSelectedRepairer(null); 
    };

    const handleBookingConfirm = (bookingDetails) => {
        if (!selectedRepairer) return;

        // SAFELY ACCESS PROFILE DATA
        // We use optional chaining (?.) in case profile is missing
        const profileData = selectedRepairer.repairer_profile; 
        
        // 1. Get the correct Repairer ID (Not User ID)
        const realRepairerId = profileData?.repairer_id;
        
        // 2. Get the correct Service Type (e.g. "Plumbing", not "repairer")
        const realServiceType = profileData?.focus_area || 'General Repair';

        if (!realRepairerId) {
            alert("Error: Repairer profile not found.");
            return;
        }

        router.post('/bookings', {
            repairer_id: realRepairerId, // ✅ Send Profile ID
            service_type: realServiceType, // ✅ Send 'Plumbing' etc.
            scheduled_at: `${bookingDetails.date} ${bookingDetails.time}`, 
            problem_description: bookingDetails.notes || 'No details provided', 
        }, {
            onSuccess: () => {
                alert("Success! Request sent.");
                setSelectedRepairer(null);
            },
            onError: (errors) => {
                console.error("Booking Failed:", errors);
                // Helpful error alert for debugging
                alert("Failed: " + Object.values(errors).join('\n')); 
            }
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
        onSwitchToWork: handleSwitchToWorkMode 
    };

    // --- RENDER ---

    // A. Repairer View (Only shown if isWorkMode is true)
    if (isWorkMode) {
        return (
            <RepairerDashboard 
                user={user} 
                profile={profile}
                jobs={jobs}
                schedule={schedule}
                isGoogleConnected={isGoogleConnected}
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