import React, { useState, useEffect } from 'react';
import { router, useForm } from '@inertiajs/react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- 1. LEAFLET SETUP & HELPERS ---

// Fix Default Icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Emoji Marker
const createEmojiIcon = (type) => {
    const emoji = type === 'customer' ? '📍' : '🛠️'; 
    return L.divIcon({
        className: 'custom-emoji-marker',
        html: `<div style="font-size: 30px; line-height: 1; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3)); transform: translate(-50%, -50%);">${emoji}</div>`,
        iconSize: [0, 0], 
        iconAnchor: [0, 0], 
    });
};

// Auto-Fit Map
function FitBounds({ markers }) {
    const map = useMap();
    useEffect(() => {
        if (markers.length > 0) {
            const validMarkers = markers.filter(m => m[0] !== 0 && !isNaN(m[0]));
            if (validMarkers.length > 0) {
                const bounds = L.latLngBounds(validMarkers);
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [markers, map]);
    return null;
}

// Map Resizer
function MapInvalidator() {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => map.invalidateSize(), 200);
    }, [map]);
    return null;
}

// Distance Calc
function getDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return "N/A";
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
}

// --- 2. MAIN COMPONENT ---

export default function RepairerDesktop({ 
    user, 
    profile, 
    jobs = [], 
    schedule = [], 
    conversations = [], 
    isGoogleConnected, 
    onSwitchToCustomer,
    onApprove, 
    onReject,
    onComplete, 
    onLogout 
}) {
    // --- STATE ---
    const [isOnSchedule, setIsOnSchedule] = useState(schedule && schedule.some(day => day.is_active));
    const [activeTab, setActiveTab] = useState('jobs'); 
    const [jobsSubView, setJobsSubView] = useState('menu'); 
    const [selectedStatus, setSelectedStatus] = useState('pending');
    
    // 🆕 MODAL STATE
    const [selectedJob, setSelectedJob] = useState(null); 

    const { data, setData, put, processing } = useForm({
        schedule: (schedule && schedule.length > 0) ? schedule : [] 
    });

    const currentView = (!isOnSchedule && isGoogleConnected) ? 'schedule' : activeTab;

    // --- ACTIONS ---
    const updateDay = (index, field, value) => {
        const newSchedule = [...data.schedule];
        newSchedule[index][field] = value;
        setData('schedule', newSchedule);
    };

    const saveSchedule = () => {
        put('/repairer/availability', {
            preserveScroll: true,
            onSuccess: () => {
                const newStatus = data.schedule.some(day => day.is_active);
                setIsOnSchedule(newStatus);
                if (currentView === 'schedule' && newStatus) {
                    setActiveTab('jobs'); 
                    alert('Setup Complete! You are now ON SCHEDULE.');
                } else {
                    alert('Availability Saved!');
                }
            }
        });
    };

    const handleOpenChat = (bookingId) => {
        router.visit(`/test-chat/${bookingId}`);
    };

    const handleOpenJobList = (status) => {
        setSelectedStatus(status);
        setJobsSubView('list');
    };

    // Modal Helpers
    const handleApproveAndClose = (id) => { onApprove(id); setSelectedJob(null); };
    const handleRejectAndClose = (id) => { onReject(id); setSelectedJob(null); };

    // 🆕 COMPLETE HANDLER (With Confirmation)
    const handleCompleteAndClose = (id) => {
        if(confirm("Are you sure this job is finished?")) {
            onComplete(id);
            setSelectedJob(null);
        }
    };

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // --- 3. SUB-COMPONENTS ---

    // 🆕 THE DESKTOP MAP MODAL
    const JobDetailsModal = ({ job, onClose }) => {
        if (!job) return null;

        // Coordinates
        const repairerLat = parseFloat(profile?.location?.latitude || user?.location?.latitude || 7.1907);
        const repairerLng = parseFloat(profile?.location?.longitude || user?.location?.longitude || 125.4553);
        const customerLat = parseFloat(job.latitude);
        const customerLng = parseFloat(job.longitude);
        const hasCustomerLocation = !isNaN(customerLat) && !isNaN(customerLng);

        // Map Logic
        const mapCenter = hasCustomerLocation ? [customerLat, customerLng] : [repairerLat, repairerLng];
        const distance = hasCustomerLocation ? getDistance(repairerLat, repairerLng, customerLat, customerLng) : "Unknown";

        const openGoogleMaps = () => {
            if (!hasCustomerLocation) return alert("No customer location available.");
            window.open(`https://www.google.com/maps/dir/?api=1&origin=${repairerLat},${repairerLng}&destination=${customerLat},${customerLng}&travelmode=driving`, '_blank');
        };

        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>
                
                {/* Desktop Card */}
                <div className="bg-white w-[900px] h-[600px] rounded-2xl relative z-10 shadow-2xl flex overflow-hidden animate-scale-up">
                    
                    {/* LEFT SIDE: MAP */}
                    <div className="w-1/2 bg-gray-100 relative h-full">
                        <MapContainer 
                            key={job.id} 
                            center={mapCenter} 
                            zoom={13} 
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                            
                            <Marker position={[repairerLat, repairerLng]} icon={createEmojiIcon('repairer')}>
                                <Popup><strong>You (Repairer)</strong></Popup>
                            </Marker>

                            {hasCustomerLocation && (
                                <Marker position={[customerLat, customerLng]} icon={createEmojiIcon('customer')}>
                                    <Popup><strong>Customer</strong><br/>{distance} km away</Popup>
                                </Marker>
                            )}

                            {hasCustomerLocation && <FitBounds markers={[[repairerLat, repairerLng], [customerLat, customerLng]]} />}
                            <MapInvalidator />
                        </MapContainer>

                        {/* Overlay Info */}
                        <div className="absolute bottom-6 left-6 z-[500] bg-white/90 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-white/50">
                             <div className="flex items-center gap-3">
                                <span className="text-2xl">🚗</span>
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Est. Trip</p>
                                    <p className="font-black text-gray-900 leading-none text-lg">{distance} km</p>
                                </div>
                             </div>
                        </div>

                        {/* Google Maps Button */}
                        {hasCustomerLocation && (
                            <button 
                                onClick={openGoogleMaps}
                                className="absolute bottom-6 right-6 z-[500] bg-blue-600 text-white h-14 w-14 rounded-full shadow-xl flex items-center justify-center text-2xl hover:bg-blue-700 active:scale-95 transition-transform border-4 border-white"
                                title="Open in Google Maps"
                            >
                                🗺️
                            </button>
                        )}
                    </div>

                    {/* RIGHT SIDE: DETAILS */}
                    <div className="w-1/2 p-8 flex flex-col h-full bg-white">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-2 ${
                                    job.status === 'pending' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {job.status === 'pending' ? 'New Request' : job.status}
                                </span>
                                <h2 className="text-3xl font-black text-gray-900 leading-tight">{job.service_type}</h2>
                            </div>
                            <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                                ✕
                            </button>
                        </div>

                        <div className="space-y-6 flex-grow overflow-y-auto pr-2">
                            {/* Customer Row */}
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-black text-gray-600 border border-gray-200">
                                    {job.customer?.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Customer Name</p>
                                    <p className="font-bold text-gray-900 text-lg">{job.customer?.name}</p>
                                </div>
                            </div>

                            {/* Date Row */}
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 flex items-center justify-center text-xl bg-orange-50 rounded-xl">📅</div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Scheduled Date</p>
                                    <p className="font-bold text-gray-900 text-lg">
                                        {new Date(job.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} 
                                        <span className="text-gray-400 text-sm mx-2">|</span>
                                        {new Date(job.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            {/* Description Box */}
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Issue Description</p>
                                <p className="text-gray-700 font-medium leading-relaxed text-sm">
                                    "{job.problem_description || 'No description provided.'}"
                                </p>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-6 border-t border-gray-100 mt-auto">
                            {job.status === 'pending' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => handleRejectAndClose(job.id)} 
                                        className="py-4 rounded-xl border-2 border-red-100 text-red-600 font-bold hover:bg-red-50 transition-colors"
                                    >
                                        Decline
                                    </button>
                                    <button 
                                        onClick={() => handleApproveAndClose(job.id)} 
                                        className="py-4 rounded-xl bg-black text-white font-bold shadow-xl hover:bg-gray-800 transition-colors"
                                    >
                                        Accept Job
                                    </button>
                                </div>
                            ) : job.status === 'confirmed' ? (
                                // 🟢 THIS IS THE COMPLETE BUTTON FOR ACCEPTED JOBS
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => handleOpenChat(job.id)}
                                        className="py-4 rounded-xl bg-blue-50 text-blue-600 font-bold border border-blue-100 hover:bg-blue-100 transition-colors"
                                    >
                                        Message
                                    </button>
                                    <button 
                                        onClick={() => handleCompleteAndClose(job.id)}
                                        className="py-4 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg transition-colors"
                                    >
                                        Complete Job
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={onClose}
                                    className="w-full py-4 rounded-xl bg-gray-100 text-gray-700 font-bold border border-gray-200"
                                >
                                    Close Details
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Sidebar Component
    const SidebarItem = ({ id, label, icon, disabled, badge }) => (
        <button 
            onClick={() => {
                if (!disabled) {
                    setActiveTab(id);
                    if (id === 'jobs') setJobsSubView('menu');
                }
            }}
            disabled={disabled}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold relative ${
                currentView === id 
                ? 'bg-black text-white shadow-lg' 
                : disabled 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
        >
            <span className="text-xl">{icon}</span>
            {label}
            {disabled && <span className="ml-auto text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-400">LOCKED</span>}
            {!disabled && badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {badge}
                </span>
            )}
        </button>
    );

    // 1. JOBS MENU
    const JobsMenu = () => {
        const pendingCount = jobs.filter(j => j.status === 'pending').length;
        const activeCount = jobs.filter(j => j.status === 'confirmed').length;
        const completedCount = jobs.filter(j => j.status === 'completed').length;

        const nextJob = jobs
            .filter(j => j.status === 'confirmed')
            .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))[0];

        return (
            <div className="animate-fade-in-up space-y-8">
                
                {/* 1. The 3 Main Buckets */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Job Overview</h2>
                    <div className="grid grid-cols-3 gap-6">
                        <button onClick={() => handleOpenJobList('pending')} className="bg-yellow-50 border border-yellow-100 p-8 rounded-2xl flex flex-col items-start hover:shadow-md transition-all group text-left">
                            <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center text-2xl font-black text-yellow-600 shadow-sm mb-4 group-hover:scale-110 transition-transform">{pendingCount}</div>
                            <h3 className="text-xl font-black text-yellow-900">Pending Requests</h3>
                            <p className="text-sm text-yellow-700 mt-1">Review and accept new jobs.</p>
                        </button>

                        <button onClick={() => handleOpenJobList('confirmed')} className="bg-green-50 border border-green-100 p-8 rounded-2xl flex flex-col items-start hover:shadow-md transition-all group text-left">
                            <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center text-2xl font-black text-green-600 shadow-sm mb-4 group-hover:scale-110 transition-transform">{activeCount}</div>
                            <h3 className="text-xl font-black text-green-900">Active Jobs</h3>
                            <p className="text-sm text-green-700 mt-1">Jobs currently in progress.</p>
                        </button>

                        <button onClick={() => handleOpenJobList('completed')} className="bg-gray-50 border border-gray-100 p-8 rounded-2xl flex flex-col items-start hover:shadow-md transition-all group text-left">
                            <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center text-2xl font-black text-gray-400 shadow-sm mb-4 group-hover:scale-110 transition-transform">{completedCount}</div>
                            <h3 className="text-xl font-black text-gray-900">Job History</h3>
                            <p className="text-sm text-gray-500 mt-1">Past completed work.</p>
                        </button>
                    </div>
                </div>

                {/* 2. NEXT SCHEDULED JOB BANNER */}
                {nextJob ? (
                    <div className="bg-white rounded-2xl shadow-lg border-l-8 border-blue-600 p-8 flex items-center justify-between">
                        <div className="flex gap-6 items-center">
                            <div className="bg-blue-50 text-blue-700 px-6 py-4 rounded-xl text-center min-w-[100px]">
                                <p className="text-xs font-bold uppercase tracking-wider mb-1">Next Up</p>
                                <p className="text-2xl font-black">
                                    {new Date(nextJob.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </p>
                                <p className="text-xs font-bold">
                                    {new Date(nextJob.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-1">{nextJob.service_type}</h3>
                                <div className="flex items-center gap-3 text-gray-500 text-sm mb-2">
                                    <span className="flex items-center gap-1 font-medium text-gray-900">
                                        <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold">
                                            {nextJob.customer?.name.charAt(0)}
                                        </div>
                                        {nextJob.customer?.name}
                                    </span>
                                    <span>•</span>
                                    <span className="italic truncate max-w-md">{nextJob.problem_description || 'No description provided'}</span>
                                </div>
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                                    💰 Est. Earnings: ${nextJob.price || '0.00'}
                                </span>
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedJob(nextJob)} // 👈 OPEN MODAL
                            className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-md flex items-center gap-2"
                        >
                            View Job details →
                        </button>
                    </div>
                ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center border-dashed">
                        <p className="text-gray-400 font-bold">No upcoming jobs scheduled. You are all clear!</p>
                    </div>
                )}
            </div>
        );
    };

    // 2. JOBS LIST (THE TABLE)
    const JobsList = () => {
        const filteredJobs = jobs.filter(j => j.status === selectedStatus);
        
        let title = 'Pending Requests';
        if (selectedStatus === 'confirmed') title = 'Active Jobs';
        if (selectedStatus === 'completed') title = 'Job History';

        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-right">
                <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                    <button 
                        onClick={() => setJobsSubView('menu')}
                        className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        ← Back
                    </button>
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                </div>
                
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                        <tr>
                            <th className="px-6 py-4">Service</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Date & Time</th>
                            <th className="px-6 py-4">Price</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredJobs.map(job => (
                            <tr key={job.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedJob(job)}> {/* Click Row to Open Modal */}
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{job.service_type}</div>
                                    <div className="text-xs text-gray-500 truncate max-w-[150px]">
                                        {job.problem_description || 'No description'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">
                                    {job.customer?.name || 'Guest'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {new Date(job.scheduled_at).toLocaleString('en-US', { 
                                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                                    })}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-green-700">
                                    ${job.price || '0.00'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                        job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                        job.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {job.status === 'confirmed' ? 'ACCEPTED' : job.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}
                                        className="text-blue-600 hover:underline text-xs font-bold"
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredJobs.length === 0 && (
                            <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400">No jobs in this category.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    // 3. MESSAGES VIEW
    const ChatsView = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {conversations.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-400 text-lg">Your inbox is empty.</p>
                    <p className="text-sm text-gray-400">Accept a job to start a conversation.</p>
                </div>
            ) : (
                conversations.map(chat => (
                    <div key={chat.id} onClick={() => handleOpenChat(chat.booking_id)} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-gray-100 rounded-full overflow-hidden"><img src={`https://ui-avatars.com/api/?name=${chat.other_user_name}&background=random`} className="h-full w-full object-cover"/></div>
                                <div><h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{chat.other_user_name}</h3><p className="text-xs text-gray-500">{chat.last_message_time || 'Just now'}</p></div>
                            </div>
                            {chat.unread_count > 0 && <div className="h-2 w-2 bg-red-500 rounded-full"></div>}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">"{chat.last_message_content || 'Chat started'}"</p>
                        <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end"><span className="text-xs font-bold text-blue-600 group-hover:underline">Open Conversation →</span></div>
                    </div>
                ))
            )}
        </div>
    );

    // 4. SCHEDULE VIEW
    const ScheduleView = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                <h3 className="font-bold text-lg mb-2">Calendar Sync</h3>
                <p className="text-sm text-gray-500 mb-6">Connect your Google Calendar to automatically block off times when you are busy.</p>
                {isGoogleConnected ? (
                    <div className="flex items-center gap-2 text-green-700 font-bold bg-green-50 p-3 rounded-lg"><span>✓</span> Google Calendar Connected</div>
                ) : (
                    <a href="/auth/calendar/connect" className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">Connect Google Calendar</a>
                )}
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800">Weekly Availability</h3>
                    {processing && <span className="text-xs text-gray-400 animate-pulse">Saving...</span>}
                </div>
                <div className="divide-y divide-gray-100">
                    {data.schedule.map((day, index) => (
                        <div key={day.day_of_week} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4 w-1/3">
                                <input type="checkbox" checked={day.is_active} onChange={(e) => updateDay(index, 'is_active', e.target.checked)} className="w-5 h-5 rounded text-black focus:ring-black border-gray-300 cursor-pointer"/>
                                <span className={`font-bold ${day.is_active ? 'text-gray-900' : 'text-gray-400'}`}>{DAYS[day.day_of_week]}</span>
                            </div>
                            <div className="flex-1 flex justify-end">
                                {day.is_active ? (
                                    <div className="flex items-center gap-3">
                                        <input type="time" value={day.start_time} onChange={(e) => updateDay(index, 'start_time', e.target.value)} className="bg-white border border-gray-300 rounded-lg text-sm px-3 py-2"/>
                                        <span className="text-gray-400 font-bold">-</span>
                                        <input type="time" value={day.end_time} onChange={(e) => updateDay(index, 'end_time', e.target.value)} className="bg-white border border-gray-300 rounded-lg text-sm px-3 py-2"/>
                                    </div>
                                ) : (<span className="text-sm text-gray-400 italic py-2">Unavailable</span>)}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <button onClick={saveSchedule} disabled={processing} className="w-full bg-black text-white py-3 rounded-xl font-bold shadow-lg hover:bg-gray-800 disabled:opacity-50 transition-all transform active:scale-95">
                        {processing ? 'Saving...' : (isOnSchedule ? 'Update Availability' : 'Set Schedule & Go Online')}
                    </button>
                </div>
            </div>
        </div>
    );

    // 🛑 BLOCKING VIEW
    if (!isGoogleConnected) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-10 rounded-2xl shadow-xl max-w-lg text-center border border-gray-100">
                    <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">📅</div>
                    <h1 className="text-3xl font-black text-gray-900 mb-3">One Last Step!</h1>
                    <p className="text-gray-500 mb-8 text-lg">Welcome to the Pro Team, <strong>{user.name}</strong>.<br/>Please connect your Google Calendar to synchronize your availability.</p>
                    <a href="/auth/calendar/connect" className="block w-full bg-black text-white text-lg font-bold py-4 rounded-xl hover:bg-gray-800 transition-transform hover:scale-105">Connect Calendar & Continue →</a>
                </div>
            </div>
        );
    }

    // --- MAIN LAYOUT ---
    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* 🆕 MODAL RENDERED HERE */}
            <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} />

            {/* LEFT SIDEBAR */}
            <aside className="w-64 bg-white border-r border-gray-200 fixed h-full p-6 flex flex-col justify-between z-10">
                <div>
                    <div className="mb-8 px-4">
                        <h1 className="text-2xl font-black tracking-tight">FixMe<span className="text-blue-600">.</span></h1>
                        <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wider">Repairer Pro</p>
                    </div>
                    
                    <nav className="space-y-2">
                        <SidebarItem id="jobs" label="Jobs" icon="⚡" disabled={!isOnSchedule} />
                        <SidebarItem id="chats" label="Messages" icon="💬" disabled={!isOnSchedule} badge={conversations.filter(c => c.unread_count > 0).length} />
                        <SidebarItem id="schedule" label="Schedule" icon="📅" disabled={false} />
                    </nav>
                </div>

                {/* Bottom Profile */}
                <div className="border-t border-gray-100 pt-6 space-y-3">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 text-sm">{user.name.charAt(0)}</div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate">{profile?.business_name || user.name}</p>
                            {isOnSchedule ? (
                                <p className="text-[10px] text-green-600 font-black tracking-wide uppercase">● On Schedule</p>
                            ) : (
                                <p className="text-[10px] text-red-600 font-black tracking-wide uppercase">● Off Schedule</p>
                            )}
                        </div>
                    </div>
                    <button onClick={onSwitchToCustomer} className="w-full text-center text-xs font-bold text-blue-600 hover:text-blue-800 py-2 border border-blue-100 rounded-lg transition-colors">Switch to Customer</button>
                    <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-red-600 py-2 transition-colors">
                        Log Out
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 ml-64 p-8">
                {!(activeTab === 'jobs' && jobsSubView === 'list') && (
                    <header className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {currentView === 'jobs' && 'Overview'}
                                {currentView === 'chats' && 'Messages'}
                                {currentView === 'schedule' && 'My Schedule'}
                                {currentView === 'earnings' && 'Financials'}
                            </h1>
                            <p className="text-gray-500 text-sm">Welcome back, {user.name}</p>
                        </div>
                    </header>
                )}

                {currentView === 'jobs' && (
                    jobsSubView === 'menu' ? <JobsMenu /> : <JobsList />
                )}
                
                {currentView === 'chats' && <ChatsView />}
                {currentView === 'schedule' && <ScheduleView />}
                {currentView === 'earnings' && <div className="text-center py-20 text-gray-400">Earnings Chart Coming Soon</div>}
            </main>
        </div>
    );
}