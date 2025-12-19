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
    history = [], // Ensure default empty array
    topServices,
    jobs = [], 
    schedule = [],
    repairers = [], 
    isGoogleConnected = false,
    conversations = [],
    repairerReviews = [],
}) {
    
    const user = { ...auth.user, location: userLocation };    
    const isRepairer = user.is_repairer || user.role === 'repairer'; 

    const [isWorkMode, setIsWorkMode] = useState(isRepairer);
    const [selectedRepairer, setSelectedRepairer] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);

    //  FIXED: Calculated HERE (Before it is used)
    const pendingReviewsCount = useMemo(() => {
        if (!history) return 0;
        return history.filter(job => job.status === 'completed' && !job.review).length;
    }, [history]);

    // --- LOGIC: FILTER REPAIRERS ---
    const filteredRepairers = useMemo(() => {
        let list = repairers.filter(r => r.user_id !== user.user_id);

        if (selectedCategory) {
            list = list.filter(repairer => {
                const skills = repairer.repairer_profile?.skills || [];
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
        let normalizedRepairer = repairerOrService;

        if (repairerOrService.repairer_profile && !repairerOrService.repairer_profile.location) {
             normalizedRepairer = {
                 ...repairerOrService,
                 repairer_profile: {
                     ...repairerOrService.repairer_profile,
                     location: repairerOrService.location 
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
    // Now this works because pendingReviewsCount is defined above
    const sharedProps = {
        user,
        appointment,
        quickAccess,
        history,
        topServices,
        
        conversations, 
        categories: SERVICE_CATEGORIES,
        selectedCategory,
        onSelectCategory: setSelectedCategory,
        
        pendingReviewsCount, // 
        
        repairers: filteredRepairers,
        
        onRepairerSelect: handleRepairerSelect, 
        onSwitchToWork: handleSwitchToWorkMode 
    };

    // --- RENDER ---

    if (isWorkMode) {
        return (
            <RepairerDashboard 
                user={user} 
                profile={profile} 
                jobs={jobs}
                schedule={schedule}
                isGoogleConnected={isGoogleConnected}
                conversations={conversations}
                reviews={repairerReviews}
                onSwitchToCustomer={() => setIsWorkMode(false)} 
            />
        );
    }

    return (
        <>
            <Head title="Dashboard" />

            <div className="block md:hidden">
                <MobileDashboard {...sharedProps} />
            </div>

            <div className="hidden md:block">
                <DesktopDashboard {...sharedProps} />
            </div>
            
            <BookingModal 
                repairer={selectedRepairer} 
                user={user}
                onClose={handleCloseModal}
                onConfirm={handleBookingConfirm}
            />
        </>
    );
}