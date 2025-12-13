import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react'; 
import MobileDashboard from './Dashboard/MobileDashboard'; 
import DesktopDashboard from './Dashboard/DesktopDashboard';
import BookingModal from '../Components/BookingModal';
import RepairerDashboard from './Dashboard/Repairer/RepairerDashboard';

export default function Dashboard({ 
    auth, 
    profile, 
    appointment, 
    quickAccess, 
    history, 
    topServices,
    jobs = [], 
    schedule = [],
    repairers = [], 
    isGoogleConnected = false
}) {
    
    const user = auth.user;
    // Assuming you have an accessor or simply check the role
    const isRepairer = user.is_repairer || user.role === 'repairer'; 

    const [isWorkMode, setIsWorkMode] = useState(isRepairer);
    const [selectedRepairer, setSelectedRepairer] = useState(null);

    // --- LOGIC: FILTER REPAIRERS ---
    const availableRepairers = repairers.filter(repairer => 
        repairer.user_id !== user.user_id
    );

    // --- HANDLERS ---
    const handleSwitchToWorkMode = () => {
        if (isRepairer) {
            setIsWorkMode(true);
        } else {
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
        // We eager loaded 'repairerProfile' and 'skills' in the Controller
        const profileData = selectedRepairer.repairer_profile; 
        
        // 🛑 FIX 1: Get the Standard ID (Not repairer_id)
        const realProfileId = profileData?.id;
        
        // 🛑 FIX 2: Get Service Type from Skills (Focus area is gone)
        // If they have skills, pick the first one, otherwise default.
        const firstSkill = profileData?.skills && profileData.skills.length > 0 
            ? profileData.skills[0].name 
            : 'General Repair';

        if (!realProfileId) {
            alert("Error: Repairer profile not found.");
            return;
        }

        router.post('/bookings', {
            // 🛑 FIX 3: Send 'repairer_profile_id' to match Backend Validation
            repairer_profile_id: realProfileId, 
            service_type: firstSkill, 
            scheduled_at: `${bookingDetails.date} ${bookingDetails.time}`, 
            problem_description: bookingDetails.notes || 'No details provided', 
        }, {
            onSuccess: () => {
                // alert("Success! Request sent."); // Optional, flash message handles this usually
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
        repairers: availableRepairers,
        onRepairerSelect: handleRepairerSelect, 
        onSwitchToWork: handleSwitchToWorkMode 
    };

    // --- RENDER ---

    // A. Repairer View
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