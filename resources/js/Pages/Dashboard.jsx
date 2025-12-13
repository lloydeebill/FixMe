import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react'; 
import MobileDashboard from './Dashboard/MobileDashboard'; 
import DesktopDashboard from './Dashboard/DesktopDashboard';
import BookingModal from '../Components/BookingModal';
import RepairerDashboard from './Dashboard/Repairer/RepairerDashboard';

export default function Dashboard({ 
    auth, 
    // isRepairer, // 👈 REMOVED: We use auth.user.is_repairer (since we appended it in the Model)
    profile, 
    appointment, 
    quickAccess, 
    history, 
    topServices,
    jobs = [], 
    schedule = [],
    repairers = [], // 👈 ADDED: Required to show the list of pros
    isGoogleConnected = false
}) {
    
    const user = auth.user;
    // Get the status directly from the user object (thanks to the $appends in User.php)
    const isRepairer = user.is_repairer; 

    // --- STATE ---
    // Default to work mode ONLY if they are a repairer AND switched to it previously? 
    // For now, defaulting to false (Customer Mode) is usually safer, 
    // or pass a prop 'defaultMode' from controller.
    const [isWorkMode, setIsWorkMode] = useState(isRepairer);
    const [selectedRepairer, setSelectedRepairer] = useState(null);

    // --- LOGIC: FILTER REPAIRERS ---
    // 🛑 We do this HERE so both Mobile/Desktop get the clean list
    // 1. Remove myself (if I am a repairer)
    // 2. (Optional) Remove anyone without a completed profile
    const availableRepairers = repairers.filter(repairer => 
        repairer.user_id !== user.user_id
    );

    // --- HANDLERS ---
    
    // 🛑 THE SMART SWITCH LOGIC
    const handleSwitchToWorkMode = () => {
        if (isRepairer) {
            // Case A: They are already a pro -> Show the Dashboard
            setIsWorkMode(true);
        } else {
            // Case B: They are just a customer -> Go to Registration Page
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
        // In your Controller, ensure you load repairers with: User::with('repairerProfile')->get()
        const profileData = selectedRepairer.repairer_profile; 
        
        // 1. Get the correct Repairer ID
        const realRepairerId = profileData?.repairer_id;
        
        // 2. Get the correct Service Type
        const realServiceType = profileData?.focus_area || 'General Repair';

        if (!realRepairerId) {
            alert("Error: Repairer profile not found.");
            return;
        }

        router.post('/bookings', {
            repairer_id: realRepairerId, 
            service_type: realServiceType, 
            scheduled_at: `${bookingDetails.date} ${bookingDetails.time}`, 
            problem_description: bookingDetails.notes || 'No details provided', 
        }, {
            onSuccess: () => {
                alert("Success! Request sent.");
                setSelectedRepairer(null);
            },
            onError: (errors) => {
                console.error("Booking Failed:", errors);
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
        repairers: availableRepairers, // 👈 PASS THE FILTERED LIST HERE
        onRepairerSelect: handleRepairerSelect, 
        onSwitchToWork: handleSwitchToWorkMode 
    };

    // --- RENDER ---

    // A. Repairer View (Only shown if isWorkMode is true)
    if (isWorkMode) {
        return (
            <RepairerDashboard 
                user={user} 
                profile={profile} // Pass the specific profile data
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