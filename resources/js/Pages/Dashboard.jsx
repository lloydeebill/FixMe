import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react'; 
import MobileDashboard from './Dashboard/MobileDashboard'; 
import DesktopDashboard from './Dashboard/DesktopDashboard';
import BookingModal from '../Components/BookingModal';
import RepairerDashboard from './Dashboard/Repairer/RepairerDashboard';

// --- CONSTANTS ---
const SERVICE_CATEGORIES = [
    { name: 'Plumbing', slug: 'plumbing', icon: '🚰', color: 'bg-blue-100 text-blue-600' },
    { name: 'Electrical', slug: 'electrical', icon: '⚡', color: 'bg-yellow-100 text-yellow-600' },
    { name: 'Carpentry', slug: 'carpentry', icon: '🪚', color: 'bg-orange-100 text-orange-600' },
    { name: 'Appliance Repair', slug: 'appliance-repair', icon: '🔌', color: 'bg-gray-100 text-gray-600' },
    { name: 'Aircon Services', slug: 'aircon-services', icon: '❄️', color: 'bg-cyan-100 text-cyan-600' },
    { name: 'Masonry', slug: 'masonry', icon: '🧱', color: 'bg-red-100 text-red-600' },
    { name: 'Painting', slug: 'painting', icon: '🎨', color: 'bg-purple-100 text-purple-600' },
    { name: 'Cleaning', slug: 'cleaning', icon: '🧹', color: 'bg-green-100 text-green-600' },
    { name: 'Gardening', slug: 'gardening', icon: '🌿', color: 'bg-emerald-100 text-emerald-600' },
    { name: 'Computer Services', slug: 'computer-services', icon: '💻', color: 'bg-indigo-100 text-indigo-600' },
    { name: 'Tailoring', slug: 'tailoring', icon: '🧵', color: 'bg-pink-100 text-pink-600' },
    { name: 'Shoe Repair', slug: 'shoe-repair', icon: '👞', color: 'bg-amber-100 text-amber-600' }
];

export default function Dashboard({ 
    auth, 
    profile, 
    appointment, 
    userLocation,
    quickAccess, 
    history, 
    topServices,
    jobs = [], 
    schedule = [],
    repairers = [], 
    isGoogleConnected = false
}) {
    
    const user = { ...auth.user, location: userLocation };    
    const isRepairer = user.is_repairer || user.role === 'repairer'; 

    const [isWorkMode, setIsWorkMode] = useState(isRepairer);
    const [selectedRepairer, setSelectedRepairer] = useState(null);
    
    // 🆕 NEW: State to track selected category
    const [selectedCategory, setSelectedCategory] = useState(null);

    // --- LOGIC: FILTER REPAIRERS ---
    // 1. Remove self from list
    // 2. Filter by Category (if selected)
    const filteredRepairers = useMemo(() => {
        let list = repairers.filter(r => r.user_id !== user.user_id);

        if (selectedCategory) {
            list = list.filter(repairer => {
                const skills = repairer.repairer_profile?.skills || [];
                // Check if any of the repairer's skills match the selected category slug
                return skills.some(skill => skill.slug === selectedCategory.slug);
            });
        }
        return list;
    }, [repairers, user.user_id, selectedCategory]);

    // --- HANDLERS ---
    const handleSwitchToWorkMode = () => {
        if (isRepairer) {
            setIsWorkMode(true);
        } else {
            router.get('/become-repairer');
        }
    };

    const handleRepairerSelect = (repairerOrService) => {
        // 🛑 FIX: Normalize data structure
        // If we clicked a "Top Service", the location is directly on the object, 
        // but BookingModal expects it inside 'location' or 'repairer_profile.location'.
        
        let normalizedRepairer = repairerOrService;

        // Check if it's a "Top Service" object (which has a flat 'location' property)
        if (repairerOrService.repairer_profile && !repairerOrService.repairer_profile.location) {
             // Inject the location into the profile so BookingModal finds it
             normalizedRepairer = {
                 ...repairerOrService,
                 repairer_profile: {
                     ...repairerOrService.repairer_profile,
                     location: repairerOrService.location // Use the location we loaded in Controller
                 }
             };
        }

        setSelectedRepairer(normalizedRepairer); 
    };

    const handleCloseModal = () => {
        setSelectedRepairer(null); 
    };

    const handleBookingConfirm = (bookingDetails) => {
        if (!selectedRepairer) return;

        const profileData = selectedRepairer.repairer_profile; 
        const realProfileId = profileData?.id;
        
        // Use the selected category name if available, otherwise fallback to first skill
        const serviceType = selectedCategory 
            ? selectedCategory.name 
            : (profileData?.skills?.[0]?.name || 'General Repair');

        if (!realProfileId) {
            alert("Error: Repairer profile not found.");
            return;
        }

        router.post('/bookings', {
            repairer_profile_id: realProfileId, 
            service_type: serviceType, 
            scheduled_at: `${bookingDetails.date} ${bookingDetails.time}`, 
            problem_description: bookingDetails.notes || 'No details provided', 
        }, {
            onSuccess: () => {
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
        user,
        appointment,
        quickAccess,
        history,
        topServices, // You might not need this anymore on mobile
        
        // 👇 PASS THE NEW STUFF DOWN
        categories: SERVICE_CATEGORIES,
        selectedCategory,
        onSelectCategory: setSelectedCategory,
        
        // Pass the FILTERED list, not the raw list
        repairers: filteredRepairers,
        
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
                user={user}
                onClose={handleCloseModal}
                onConfirm={handleBookingConfirm}
            />
        </>
    );
}