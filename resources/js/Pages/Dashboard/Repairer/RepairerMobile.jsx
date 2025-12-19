import React, { useState, useEffect } from 'react';
import { router, useForm } from '@inertiajs/react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- 1. LEAFLET ICONS & HELPERS ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createEmojiIcon = (type) => {
    // 📍 for Customer, 🛠️ for Repairer
    const emoji = type === 'customer' ? '📍' : '🛠️'; 
    return L.divIcon({
        className: 'custom-emoji-marker',
        html: `<div style="font-size: 30px; line-height: 1; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3)); transform: translate(-50%, -50%);">${emoji}</div>`,
        iconSize: [0, 0], 
        iconAnchor: [0, 0], 
    });
};

function FitBounds({ markers }) {
    const map = useMap();
    useEffect(() => {
        if (markers.length > 0) {
            const validMarkers = markers.filter(m => m[0] !== 0 && !isNaN(m[0]));
            if (validMarkers.length > 0) {
                const bounds = L.latLngBounds(validMarkers);
                map.fitBounds(bounds, { padding: [80, 80] }); 
            }
        }
    }, [markers, map]);
    return null;
}

function MapInvalidator() {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => map.invalidateSize(), 200);
    }, [map]);
    return null;
}

function getDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return "N/A";
    const R = 6371; // km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
}

// --- 2. MAIN COMPONENT ---

export default function RepairerMobile({ 
    user, 
    profile, 
    jobs = [], 
    schedule = [], 
    conversations = [], 
    onSwitchToCustomer,
    onApprove, 
    onReject,
    onComplete, 
    onLogout 
}) {
    // STATE
    const [activeTab, setActiveTab] = useState('jobs');
    const [jobsSubView, setJobsSubView] = useState('menu'); 
    const [selectedStatus, setSelectedStatus] = useState('pending');
    const [selectedJob, setSelectedJob] = useState(null); 

    const isOnSchedule = schedule && schedule.some(day => day.is_active);

    // SCHEDULE FORM
    const { data, setData, put, processing } = useForm({
        schedule: (schedule && schedule.length > 0) ? schedule : [] 
    });

    const updateDay = (index, field, value) => {
        const newSchedule = [...data.schedule];
        newSchedule[index][field] = value;
        setData('schedule', newSchedule);
    };

    const saveSchedule = () => {
        put('/repairer/availability', {
            preserveScroll: true,
            onSuccess: () => alert('Availability Updated!')
        });
    };

    // HANDLERS
    const handleOpenChat = (bookingId) => router.visit(`/test-chat/${bookingId}`);
    const handleOpenJobList = (status) => { setSelectedStatus(status); setJobsSubView('list'); };
    const handleApproveAndClose = (id) => { onApprove(id); setSelectedJob(null); };
    const handleRejectAndClose = (id) => { onReject(id); setSelectedJob(null); };
    
    const handleCompleteAndClose = (id) => {
        if(confirm("Are you sure this job is finished?")) {
            onComplete(id);
            setSelectedJob(null);
        }
    };

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // --- 3. SUB-COMPONENTS ---

    // FULL SCREEN JOB DETAILS MODAL
    const JobDetailsModal = ({ job, onClose }) => {
        if (!job) return null;

        const repairerLat = parseFloat(profile?.location?.latitude || user?.location?.latitude || 7.1907);
        const repairerLng = parseFloat(profile?.location?.longitude || user?.location?.longitude || 125.4553);
        const customerLat = parseFloat(job.latitude);
        const customerLng = parseFloat(job.longitude);
        const hasCustomerLocation = !isNaN(customerLat) && !isNaN(customerLng);
        const mapCenter = hasCustomerLocation ? [customerLat, customerLng] : [repairerLat, repairerLng];
        const distance = hasCustomerLocation ? getDistance(repairerLat, repairerLng, customerLat, customerLng) : "Unknown";

        const openGoogleMaps = () => {
            if (!hasCustomerLocation) return alert("No customer location available.");
            window.open(`https://www.google.com/maps/dir/?api=1&origin=${repairerLat},${repairerLng}&destination=${customerLat},${customerLng}&travelmode=driving`, '_blank');
        };

        return (
            <div className="fixed inset-0 z-[9999] sm:flex sm:items-center sm:justify-center">
                <div onClick={onClose} className="hidden sm:block absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>
                <div className="bg-white w-full h-full sm:h-auto sm:w-[500px] sm:max-h-[90vh] sm:rounded-[30px] relative z-10 shadow-2xl flex flex-col overflow-hidden animate-slide-up">
                    <div className="absolute top-4 right-4 z-[500]">
                        <button onClick={onClose} className="bg-white/90 p-2 rounded-full text-black shadow-lg border border-gray-100 active:scale-95 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="relative w-full h-1/2 bg-[#f2e8d9] shrink-0">
                        <MapContainer 
                            key={job.id}
                            center={mapCenter} 
                            zoom={13} 
                            zoomControl={false}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                            <Marker position={[repairerLat, repairerLng]} icon={createEmojiIcon('repairer')}>
                                <Popup><strong>You</strong></Popup>
                            </Marker>
                            {hasCustomerLocation && (
                                <Marker position={[customerLat, customerLng]} icon={createEmojiIcon('customer')}>
                                    <Popup><strong>Customer</strong><br/>{distance} km away</Popup>
                                </Marker>
                            )}
                            {hasCustomerLocation && <FitBounds markers={[[repairerLat, repairerLng], [customerLat, customerLng]]} />}
                            <MapInvalidator />
                        </MapContainer>

                        <div className="absolute bottom-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/50">
                             <div className="flex items-center gap-2">
                                <span className="text-xl">🚗</span>
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Est. Distance</p>
                                    <p className="font-black text-[#5d4037] leading-none">{distance} km away</p>
                                </div>
                             </div>
                        </div>

                        {hasCustomerLocation && (
                            <button 
                                onClick={openGoogleMaps}
                                // Changed button to Brown
                                className="absolute -bottom-6 right-6 z-[600] bg-[#5d4037] text-white h-14 w-14 rounded-full shadow-xl flex items-center justify-center text-2xl hover:bg-[#8c6745] active:scale-95 transition-transform border-4 border-white"
                            >
                                🗺️
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto bg-white relative pt-8 px-6 pb-32">
                        <div className="mb-6">
                            <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider mb-2 ${
                                // Status Colors: Pending (Orange/Warm), Completed (Beige), Confirmed (Green/Warm)
                                job.status === 'pending' ? 'bg-orange-50 text-orange-700' : 'bg-[#f2e8d9] text-[#5d4037]'
                            }`}>
                                {job.status === 'pending' ? 'New Request' : job.status}
                            </span>
                            <h2 className="text-3xl font-black text-[#5d4037] leading-none">{job.service_type}</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 bg-[#faf9f6] rounded-full flex items-center justify-center text-2xl font-black text-[#dcb6a2] border border-[#f2e8d9]">
                                    {job.customer?.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Customer Name</p>
                                    <p className="font-bold text-[#5d4037] text-xl">{job.customer?.name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 flex items-center justify-center text-2xl bg-[#f2e8d9] rounded-2xl">📅</div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Schedule</p>
                                    <p className="font-bold text-[#5d4037] text-lg">
                                        {new Date(job.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} 
                                    </p>
                                    <p className="text-sm text-gray-500 font-medium">
                                        @ {new Date(job.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-[#faf9f6] p-5 rounded-2xl border border-[#f2e8d9]">
                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Issue Description</p>
                                <p className="text-gray-700 font-medium leading-relaxed">
                                    "{job.problem_description || 'No description provided.'}"
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 w-full p-4 bg-white/80 backdrop-blur-md border-t border-[#f2e8d9] z-50">
                        {job.status === 'pending' ? (
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => handleRejectAndClose(job.id)} 
                                    className="py-4 rounded-xl border-2 border-red-100 text-red-600 font-bold text-lg hover:bg-red-50 transition-colors"
                                >
                                    Decline
                                </button>
                                <button 
                                    onClick={() => handleApproveAndClose(job.id)} 
                                    // Accept Button -> Dark Brown
                                    className="py-4 rounded-xl bg-[#5d4037] text-white font-bold text-lg shadow-xl active:scale-95 transition-transform"
                                >
                                    Accept Job
                                </button>
                            </div>
                        ) : job.status === 'confirmed' ? (
                            <div className="grid grid-cols-2 gap-3">
                                 <button 
                                    onClick={() => handleOpenChat(job.id)}
                                    // Chat Button -> Beige
                                    className="py-4 rounded-xl bg-[#f2e8d9] text-[#5d4037] font-bold text-lg border border-[#dcb6a2]"
                                >
                                    Chat
                                </button>
                                <button 
                                    onClick={() => handleCompleteAndClose(job.id)}
                                    // Complete Button -> Copper/Greenish
                                    className="py-4 rounded-xl bg-[#b86c45] text-white font-bold text-lg shadow-xl active:scale-95 transition-transform"
                                >
                                    Complete Job
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={onClose}
                                className="w-full py-4 rounded-xl bg-gray-100 text-gray-700 font-bold text-lg"
                            >
                                Close Details
                            </button>
                        )}
                    </div>

                </div>
            </div>
        );
    };

    // 2. UPDATED JOB CARD
    const JobCard = ({ job }) => (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#f2e8d9] mb-4 animate-fade-in-up relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-bold text-[#5d4037] text-lg">{job.service_type}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase mt-1">
                        {new Date(job.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                </div>
                <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    job.status === 'pending' ? 'bg-orange-50 text-orange-700' :
                    job.status === 'confirmed' ? 'bg-[#f2e8d9] text-[#5d4037]' :
                    'bg-gray-100 text-gray-600'
                }`}>
                    {job.status}
                </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4 line-clamp-2 pl-3 border-l-2 border-[#dcb6a2]">
                {job.problem_description || 'No description.'}
            </p>
            
            <div className="pt-3 border-t border-[#faf9f6] flex gap-2">
                 <button 
                    onClick={() => setSelectedJob(job)} 
                    // View Button -> Dark Brown
                    className="flex-1 py-3 bg-[#5d4037] text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                    <span>View Details</span>
                    <span>→</span>
                </button>
            </div>
        </div>
    );

    // --- VIEWS ---
    const JobsMenu = () => {
        const pendingCount = jobs.filter(j => j.status === 'pending').length;
        const activeCount = jobs.filter(j => j.status === 'confirmed').length; 
        const completedCount = jobs.filter(j => j.status === 'completed').length;

        const MenuItem = ({ title, count, color, onClick, sub }) => (
            <button onClick={onClick} className={`w-full p-6 rounded-3xl flex items-center justify-between shadow-sm active:scale-95 transition-transform border mb-4 ${color}`}>
                <div className="text-left">
                    <h3 className="text-xl font-black">{title}</h3>
                    <p className="text-sm opacity-70 font-medium">{sub}</p>
                </div>
                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-xl font-black shadow-sm">{count}</div>
            </button>
        );

        return (
            <div className="px-6 pb-24 pt-4 animate-fade-in-up">
                {/* Pending -> Warm Orange tone */}
                <MenuItem title="Pending" sub="Needs Approval" count={pendingCount} onClick={() => handleOpenJobList('pending')} color="bg-orange-50 text-orange-900 border-orange-100" />
                {/* Active -> Beige/Brown tone */}
                <MenuItem title="Active Jobs" sub="Scheduled" count={activeCount} onClick={() => handleOpenJobList('confirmed')} color="bg-[#f2e8d9] text-[#5d4037] border-[#dcb6a2]" />
                {/* History -> Gray tone */}
                <MenuItem title="History" sub="Completed" count={completedCount} onClick={() => handleOpenJobList('completed')} color="bg-gray-50 text-gray-900 border-gray-100" />
            </div>
        );
    };

    const JobsList = () => {
        const filteredJobs = jobs.filter(j => j.status === selectedStatus);
        let title = 'Pending Requests';
        if (selectedStatus === 'confirmed') title = 'Active Jobs';
        if (selectedStatus === 'completed') title = 'Job History';

        return (
            <div className="px-4 pb-24 pt-2 animate-fade-in-right">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setJobsSubView('menu')} className="h-10 w-10 bg-white border border-gray-200 rounded-full shadow-sm active:bg-gray-100 flex items-center justify-center font-bold text-lg text-[#5d4037]">←</button>
                    <h2 className="text-2xl font-black text-[#5d4037]">{title}</h2>
                </div>
                {filteredJobs.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <div className="text-6xl mb-4">📂</div>
                        <p className="font-bold text-gray-400">No jobs found.</p>
                    </div>
                ) : (
                    filteredJobs.map(job => <JobCard key={job.id} job={job} />)
                )}
            </div>
        );
    };

    const ChatsView = () => (
        <div className="px-4 pb-24 pt-20 text-center text-gray-400 font-bold">
            {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="bg-[#f2e8d9] p-6 rounded-full mb-4"><span className="text-4xl">💬</span></div>
                    <h3 className="font-bold text-[#5d4037]">No active chats</h3>
                    <p className="text-sm text-gray-500 max-w-[200px]">Messages from customers will appear here.</p>
                </div>
            ) : (
                conversations.map(chat => (
                    <div key={chat.id} onClick={() => handleOpenChat(chat.booking_id)} className="bg-white p-4 rounded-2xl shadow-sm border border-[#f2e8d9] flex items-center gap-4 active:scale-95 transition-transform mb-3 relative">
                        {chat.unread_count > 0 && <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>}
                        
                        <div className="h-14 w-14 bg-[#faf9f6] rounded-full overflow-hidden border border-[#f2e8d9] flex-shrink-0">
                            <img src={`https://ui-avatars.com/api/?name=${chat.other_user_name}&background=random`} className="h-full w-full object-cover" />
                        </div>

                        <div className="flex-1 min-w-0 text-left">
                            <div className="flex justify-between items-baseline mb-1">
                                <h3 className="font-bold text-[#5d4037] truncate">{chat.other_user_name}</h3>
                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{chat.last_message_time || 'Just now'}</span>
                            </div>
                            
                            <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#f2e8d9] text-[#5d4037] text-[10px] font-bold mb-1.5 border border-[#dcb6a2] max-w-full truncate">
                                Job #{chat.booking_id} • {chat.service_type || 'Service'}
                            </div>

                            <p className="text-sm text-gray-500 truncate block">
                                {chat.last_message_content || 'Start chatting...'}
                            </p>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const ScheduleView = () => (
        <div className="px-4 pb-24 pt-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-[#f2e8d9]">
                <h3 className="font-bold text-lg mb-4 text-[#5d4037]">Weekly Availability</h3>
                {data.schedule.map((day, index) => (
                    <div key={day.day_of_week} className="flex items-center justify-between py-3 border-b border-[#faf9f6] last:border-0">
                        <div className="flex items-center gap-3">
                            {/* Checkbox color -> Brown/Black */}
                            <input type="checkbox" checked={day.is_active} onChange={(e) => updateDay(index, 'is_active', e.target.checked)} className="w-5 h-5 rounded text-[#5d4037] focus:ring-[#5d4037] border-gray-300"/>
                            <span className={`font-bold ${day.is_active ? 'text-[#5d4037]' : 'text-gray-300'}`}>{DAYS[day.day_of_week]}</span>
                        </div>
                        {day.is_active && (
                            <div className="flex items-center gap-1">
                                <input type="time" value={day.start_time} onChange={(e) => updateDay(index, 'start_time', e.target.value)} className="w-20 text-xs p-1 border rounded bg-[#faf9f6]"/>
                                <span className="text-gray-300">-</span>
                                <input type="time" value={day.end_time} onChange={(e) => updateDay(index, 'end_time', e.target.value)} className="w-20 text-xs p-1 border rounded bg-[#faf9f6]"/>
                            </div>
                        )}
                    </div>
                ))}
                {/* Save Button -> Dark Brown */}
                <button onClick={saveSchedule} disabled={processing} className="w-full mt-4 bg-[#5d4037] text-white py-3 rounded-xl font-bold hover:bg-[#8c6745] transition-colors">
                    {processing ? 'Saving...' : 'Update Schedule'}
                </button>
            </div>
        </div>
    );

    // --- MAIN RENDER ---
    return (
        <div className="min-h-screen bg-[#faf9f6] font-sans">
            <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} />

            {/* TOP HEADER */}
            <header className="bg-white px-6 pt-12 pb-4 sticky top-0 z-10 shadow-sm flex justify-between items-center">
                <div>
                    {/* Logo Colors */}
                    <h1 className="text-2xl font-black tracking-tight text-[#5d4037]">FixMe<span className="text-[#b86c45]">.</span></h1>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                        {profile?.business_name || user.name}
                    </p>
                </div>
                {/* Online Status -> Green stays green (functional color), but background fits theme */}
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                    isOnSchedule ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'
                }`}>
                    {isOnSchedule ? '● Online' : '○ Offline'}
                </div>
            </header>

            {/* CONTENT AREA */}
            <main className="pt-2">
                {activeTab === 'jobs' && (jobsSubView === 'menu' ? <JobsMenu /> : <JobsList />)}
                {activeTab === 'chats' && <ChatsView />}
                {activeTab === 'schedule' && <ScheduleView />}
                
                {activeTab === 'profile' && (
                    <div className="px-6 pt-10 text-center">
                        {/* Switch Button -> Beige/Brown */}
                        <button onClick={onSwitchToCustomer} className="w-full py-4 bg-white border border-[#dcb6a2] font-bold rounded-2xl mb-4 shadow-sm text-[#b86c45]">Switch to Customer</button>
                        <button onClick={onLogout} className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl">Log Out</button>
                    </div>
                )}
            </main>

            {/* BOTTOM NAV BAR */}
            <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 py-3 px-6 flex justify-between items-center pb-8 z-20">
                <NavButton icon="⚡" label="Jobs" isActive={activeTab === 'jobs'} onClick={() => { setActiveTab('jobs'); setJobsSubView('menu'); }} />
                <NavButton icon="💬" label="Chats" isActive={activeTab === 'chats'} onClick={() => setActiveTab('chats')} badge={conversations.filter(c => c.unread_count > 0).length} />
                <NavButton icon="📅" label="Schedule" isActive={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} />
                <NavButton icon="👤" label="Profile" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
            </nav>
        </div>
    );
}

// Updated NavButton to use the Brown theme
const NavButton = ({ icon, label, isActive, onClick, badge }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1 relative w-16">
        <span className={`text-xl transition-transform ${isActive ? 'scale-110' : 'opacity-50 grayscale'}`}>{icon}</span>
        <span className={`text-[10px] font-bold ${isActive ? 'text-[#5d4037]' : 'text-gray-400'}`}>{label}</span>
        {badge > 0 && (
            <span className="absolute -top-1 right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {badge}
            </span>
        )}
    </button>
);