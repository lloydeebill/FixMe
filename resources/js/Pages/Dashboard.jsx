import React, { useState, useMemo, useEffect } from 'react';
import { Head, router } from '@inertiajs/react'; 
import MobileDashboard from './Dashboard/MobileDashboard'; 
import DesktopDashboard from './Dashboard/DesktopDashboard';
import BookingModal from '../Components/BookingModal';
import RepairerDashboard from './Dashboard/Repairer/RepairerDashboard';
import { filterProvidersByCategory } from './Dashboard/catalog';
import { applyConversationEvent, sortConversations } from './Dashboard/conversationState';

export default function Dashboard({ 
    auth, 
    profile, 
    appointment, 
    userLocation,
    quickAccess, 
    history = [], // Ensure default empty array
    completionJobs = [],
    topServices,
    jobs = [], 
    schedule = [],
    repairers = [], 
    isGoogleConnected = false,
    conversations = [],
    notifications = [],
    unreadNotificationsCount = 0,
    jobCounts = { pending: 0, active: 0, completed: 0 },
    repairerReviews = [],
    serviceCategories = [],
    pilotAreas = {},
}) {
    
    const user = { ...auth.user, location: userLocation };    
    const isRepairer = user.is_repairer || user.role === 'repairer'; 

    const [isWorkMode, setIsWorkMode] = useState(() => isRepairer && new URLSearchParams(window.location.search).get('mode') !== 'client');
    const [selectedRepairer, setSelectedRepairer] = useState(null);
    const [bookingFeedback, setBookingFeedback] = useState('');
    useEffect(() => {
        if (!bookingFeedback) return;
        const timer = window.setTimeout(() => setBookingFeedback(''), 5000);
        return () => window.clearTimeout(timer);
    }, [bookingFeedback]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [jobContext, setJobContext] = useState({ area: '', address: '', latitude: null, longitude: null, date: '', time: '' });
    const [suggestedProviders, setSuggestedProviders] = useState([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [suggestionsError, setSuggestionsError] = useState('');
    const [conversationSummaries, setConversationSummaries] = useState(() => sortConversations(conversations));

    useEffect(() => setConversationSummaries(sortConversations(conversations)), [conversations]);

    useEffect(() => {
        if (!selectedCategory?.slug || !jobContext.area) {
            setSuggestedProviders([]);
            setSuggestionsLoading(false);
            setSuggestionsError('');
            return;
        }
        const controller = new AbortController();
        const params = new URLSearchParams({ category: selectedCategory.slug, area: jobContext.area });
        if (jobContext.latitude != null && jobContext.longitude != null) {
            params.set('latitude', String(jobContext.latitude));
            params.set('longitude', String(jobContext.longitude));
        }
        if (jobContext.date && jobContext.time) params.set('scheduled_at', `${jobContext.date} ${jobContext.time}`);
        setSuggestedProviders([]);
        setSuggestionsLoading(true);
        setSuggestionsError('');
        fetch(`/provider-suggestions?${params}`, { credentials: 'same-origin', headers: { Accept: 'application/json' }, signal: controller.signal })
            .then(async response => {
                if (response.status === 422) {
                    const validation = await response.json();
                    throw new Error(Object.values(validation.errors || {})[0]?.[0] || 'Check the job area and requested time.');
                }
                if (!response.ok) throw new Error('Could not load suggested providers. Please try again.');
                return response.json();
            })
            .then(result => setSuggestedProviders(result.providers || []))
            .catch(error => { if (error.name !== 'AbortError') setSuggestionsError(error.message); })
            .finally(() => { if (!controller.signal.aborted) setSuggestionsLoading(false); });
        return () => controller.abort();
    }, [selectedCategory?.slug, jobContext.area, jobContext.latitude, jobContext.longitude, jobContext.date, jobContext.time]);

    useEffect(() => {
        let refreshing = false;
        const refreshConversations = () => {
            if (refreshing || document.visibilityState === 'hidden') return;
            refreshing = true;
            router.reload({ only: ['conversations', 'notifications', 'unreadNotificationsCount', 'jobs', 'jobCounts', 'history', 'completionJobs', 'appointment'], preserveState: true, preserveScroll: true, onFinish: () => { refreshing = false; } });
        };
        const timer = window.setInterval(refreshConversations, 8000);
        document.addEventListener('visibilitychange', refreshConversations);

        const channel = `messages.${user.user_id}`;
        if (window.Echo) {
            window.Echo.private(channel).listen('.message.sent', event => {
                setConversationSummaries(current => applyConversationEvent(current, event, user.user_id));
                refreshConversations();
            });
        }
        return () => {
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', refreshConversations);
            window.Echo?.leave(channel);
        };
    }, [user.user_id]);

    useEffect(() => {
        const restoreMode = () => setIsWorkMode(isRepairer && new URLSearchParams(window.location.search).get('mode') !== 'client');
        window.addEventListener('popstate', restoreMode);
        return () => window.removeEventListener('popstate', restoreMode);
    }, [isRepairer]);

    const switchMode = work => {
        const url = new URL(window.location.href);
        if (work) url.searchParams.delete('mode');
        else url.searchParams.set('mode', 'client');
        url.searchParams.delete('tab');
        window.history.pushState({ ...window.history.state, skilllinkMobileNavigation: true }, '', url);
        setIsWorkMode(work);
    };

    //  FIXED: Calculated HERE (Before it is used)
    const pendingReviewsCount = useMemo(() => {
        if (!history) return 0;
        return history.filter(job => job.status === 'completed' && job.client_accepted_at && !job.review).length;
    }, [history]);

    // --- LOGIC: FILTER REPAIRERS ---
    const filteredRepairers = useMemo(() => {
        let list = repairers.filter(r => r.user_id !== user.user_id);

        return selectedCategory ? suggestedProviders : filterProvidersByCategory(list, selectedCategory);
    }, [repairers, user.user_id, selectedCategory, suggestedProviders]);

    // --- HANDLERS ---
    const handleSwitchToWorkMode = () => {
        if (isRepairer) {
            switchMode(true);
        } else {
            router.get('/become-repairer');
        }
    };

    const openNotification = id => {
        window.sessionStorage.setItem('skilllink.notificationScroll', String(window.scrollY));
        router.post(`/notifications/${id}/open`, { mode: isWorkMode ? 'provider' : 'client' });
    };

    const handleRepairerSelect = (repairerOrService) => {
        setSelectedRepairer(repairerOrService);
    };

    const handleCloseModal = () => {
        setSelectedRepairer(null); 
    };

    const handleBookingConfirm = (bookingDetails, callbacks = {}) => {
        if (!selectedRepairer) return;

        const profileData = selectedRepairer.repairer_profile; 
        const realProfileId = profileData?.id;
        
        const offeredCategory = selectedCategory || serviceCategories.find(category =>
            profileData?.skills?.some(skill => skill.slug === category.slug));
        const serviceType = offeredCategory?.name;

        if (!realProfileId || !serviceType) {
            callbacks.onError?.('Choose a provider with an active service category.');
            callbacks.onFinish?.();
            return;
        }

        router.post('/bookings', {
            repairer_profile_id: realProfileId, 
            service_type: serviceType, 
            scheduled_at: `${bookingDetails.date} ${bookingDetails.time}`, 
            problem_description: bookingDetails.notes || 'No details provided', 
            service_area: bookingDetails.jobArea,
            job_address: bookingDetails.jobAddress,
            job_latitude: bookingDetails.jobLatitude,
            job_longitude: bookingDetails.jobLongitude,
        }, {
            onSuccess: page => {
                setBookingFeedback(page.props.flash?.message || 'Booking request sent.');
                setSelectedRepairer(null);
            },
            onError: (errors) => {
                callbacks.onError?.(Object.values(errors)[0] || 'Booking request could not be sent.');
            },
            onFinish: () => callbacks.onFinish?.(),
        });
    };

    // --- SHARED DATA BUNDLE ---
    // Now this works because pendingReviewsCount is defined above
    const sharedProps = {
        user,
        appointment,
        quickAccess,
        history,
        completionJobs,
        topServices,
        
        conversations: conversationSummaries,
        notifications,
        unreadNotificationsCount,
        onOpenNotification: openNotification,
        categories: serviceCategories,
        pilotAreas,
        jobContext,
        onJobContextChange: setJobContext,
        suggestionsLoading,
        suggestionsError,
        selectedCategory,
        onSelectCategory: setSelectedCategory,
        
        pendingReviewsCount, // 
        
        repairers: filteredRepairers,
        allRepairers: repairers,
        
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
                conversations={conversationSummaries}
                notifications={notifications}
                unreadNotificationsCount={unreadNotificationsCount}
                jobCounts={jobCounts}
                onOpenNotification={openNotification}
                reviews={repairerReviews}
                onSwitchToCustomer={() => switchMode(false)}
            />
        );
    }

    return (
        <>
            <Head title="Dashboard" />
            {bookingFeedback && <p role="status" className="fixed left-4 right-4 top-4 z-[10000] mx-auto max-w-md rounded-xl bg-green-50 p-3 text-center text-sm font-semibold text-green-800 shadow-lg">{bookingFeedback}</p>}

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
                jobContext={jobContext}
                pilotAreas={pilotAreas}
            />
        </>
    );
}
