import React, { useState, useEffect, useRef } from 'react';
import { router, useForm } from '@inertiajs/react';

export default function RepairerMobile({ 
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
    const [activeTab, setActiveTab] = useState('jobs');
    
    // ⚡ JOBS NAVIGATION STATE
    const [jobsSubView, setJobsSubView] = useState('menu'); // 'menu' or 'list'
    const [selectedStatus, setSelectedStatus] = useState('pending'); // which list to show

    // ⚡ CHAT STATE
    // (Note: We use router.visit for chat now, but keeping this simple state structure is fine)
    
    // Work Mode Logic
    const isOnSchedule = schedule && schedule.some(day => day.is_active);

    // --- FORM FOR SCHEDULE ---
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

    // --- HELPER FUNCTIONS ---
    const handleOpenChat = (bookingId) => {
        router.visit(`/test-chat/${bookingId}`);
    };

    const handleOpenJobList = (status) => {
        setSelectedStatus(status);
        setJobsSubView('list');
    };

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // --- SUB-COMPONENTS ---

    const JobCard = ({ job }) => (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-bold text-gray-900 text-lg">{job.service_type}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase mt-1">
                        {new Date(job.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                <span className="font-bold text-black">Note:</span> {job.problem_description || 'No description.'}
            </p>
            
            <div className="flex items-center gap-2 pt-3 border-t border-gray-50 mb-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                    {job.customer?.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-700">{job.customer?.name}</span>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-2">
                {job.status === 'pending' && (
                    <>
                        <button onClick={() => onReject(job.id)} className="flex-1 py-3 bg-white border border-red-200 text-red-600 font-bold text-sm rounded-xl">Decline</button>
                        <button onClick={() => onApprove(job.id)} className="flex-1 py-3 bg-black text-white font-bold text-sm rounded-xl shadow-md">Accept</button>
                    </>
                )}
                {job.status === 'confirmed' && (
                    <>
                        <button onClick={() => handleOpenChat(job.id)} className="flex-1 py-3 bg-blue-50 text-blue-600 font-bold text-sm rounded-xl">Message</button>
                        <button onClick={() => onComplete(job.id)} className="flex-1 py-3 bg-green-600 text-white font-bold text-sm rounded-xl">Complete</button>
                    </>
                )}
                {job.status === 'completed' && (
                    <div className="w-full py-2 bg-gray-100 text-gray-500 text-center text-sm font-bold rounded-xl">
                        Job Completed
                    </div>
                )}
            </div>
        </div>
    );

    // --- VIEWS ---

    // 1. THE NEW JOBS MENU (DASHBOARD STYLE)
    const JobsMenu = () => {
        // Calculate counts
        const pendingCount = jobs.filter(j => j.status === 'pending').length;
        const activeCount = jobs.filter(j => j.status === 'confirmed').length; // 'confirmed' means Accepted/Active
        const completedCount = jobs.filter(j => j.status === 'completed').length;

        return (
            <div className="px-6 pb-24 pt-2 space-y-4 animate-fade-in-up">
                {/* PENDING CARD */}
                <button 
                    onClick={() => handleOpenJobList('pending')}
                    className="w-full bg-yellow-50 border border-yellow-100 p-6 rounded-2xl flex items-center justify-between shadow-sm active:scale-95 transition-transform"
                >
                    <div className="text-left">
                        <h3 className="text-xl font-black text-yellow-900">Pending Requests</h3>
                        <p className="text-sm text-yellow-700 font-medium">Needs your approval</p>
                    </div>
                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-xl font-black text-yellow-600 shadow-sm">
                        {pendingCount}
                    </div>
                </button>

                {/* ACTIVE CARD */}
                <button 
                    onClick={() => handleOpenJobList('confirmed')}
                    className="w-full bg-green-50 border border-green-100 p-6 rounded-2xl flex items-center justify-between shadow-sm active:scale-95 transition-transform"
                >
                    <div className="text-left">
                        <h3 className="text-xl font-black text-green-900">Active Jobs</h3>
                        <p className="text-sm text-green-700 font-medium">Accepted & Scheduled</p>
                    </div>
                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-xl font-black text-green-600 shadow-sm">
                        {activeCount}
                    </div>
                </button>

                {/* HISTORY CARD */}
                <button 
                    onClick={() => handleOpenJobList('completed')}
                    className="w-full bg-gray-50 border border-gray-100 p-6 rounded-2xl flex items-center justify-between shadow-sm active:scale-95 transition-transform"
                >
                    <div className="text-left">
                        <h3 className="text-xl font-black text-gray-900">Job History</h3>
                        <p className="text-sm text-gray-500 font-medium">Past completed work</p>
                    </div>
                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-xl font-black text-gray-400 shadow-sm">
                        {completedCount}
                    </div>
                </button>
            </div>
        );
    };

    // 2. THE JOB LIST (Filtered)
    const JobsList = () => {
        const filteredJobs = jobs.filter(j => j.status === selectedStatus);
        
        // Dynamic Titles/Colors based on status
        let title = 'Pending Requests';
        let headerColor = 'text-yellow-900';
        if (selectedStatus === 'confirmed') { title = 'Active Jobs'; headerColor = 'text-green-900'; }
        if (selectedStatus === 'completed') { title = 'Job History'; headerColor = 'text-gray-900'; }

        return (
            <div className="px-4 pb-24 pt-2 animate-fade-in-right">
                {/* Back Button Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button 
                        onClick={() => setJobsSubView('menu')}
                        className="p-2 bg-white border border-gray-200 rounded-full shadow-sm active:bg-gray-100"
                    >
                        ←
                    </button>
                    <h2 className={`text-xl font-black ${headerColor}`}>{title}</h2>
                </div>

                {/* List Content */}
                {filteredJobs.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <p className="text-4xl mb-2">📂</p>
                        <p className="font-bold text-gray-400">No jobs in this category.</p>
                    </div>
                ) : (
                    filteredJobs.map(job => <JobCard key={job.id} job={job} />)
                )}
            </div>
        );
    };

    const ChatsView = () => (
        <div className="px-4 pb-24">
             {conversations.length === 0 ? (
                <div className="text-center py-20 text-gray-400"><p>No active chats.</p></div>
            ) : (
                conversations.map(chat => (
                    <div key={chat.id} onClick={() => handleOpenChat(chat.booking_id)} className="bg-white p-4 rounded-xl mb-3 border border-gray-100 flex items-center gap-4 active:bg-gray-50 cursor-pointer">
                        <div className="relative">
                            <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                                <img src={`https://ui-avatars.com/api/?name=${chat.other_user_name}&background=random`} className="w-full h-full object-cover" />
                            </div>
                            {chat.unread_count > 0 && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between">
                                <h3 className="font-bold text-gray-900">{chat.other_user_name}</h3>
                                <span className="text-[10px] text-gray-400">{chat.last_message_time || 'Now'}</span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">{chat.last_message_content || 'Start chatting...'}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const ScheduleView = () => (
        <div className="px-4 pb-24">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-4">Weekly Availability</h3>
                {data.schedule.map((day, index) => (
                    <div key={day.day_of_week} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3">
                            <input type="checkbox" checked={day.is_active} onChange={(e) => updateDay(index, 'is_active', e.target.checked)} className="w-5 h-5 rounded text-black focus:ring-black border-gray-300"/>
                            <span className={`font-bold ${day.is_active ? 'text-black' : 'text-gray-300'}`}>{DAYS[day.day_of_week]}</span>
                        </div>
                        {day.is_active && (
                            <div className="flex items-center gap-1">
                                <input type="time" value={day.start_time} onChange={(e) => updateDay(index, 'start_time', e.target.value)} className="w-20 text-xs p-1 border rounded bg-gray-50"/>
                                <span className="text-gray-300">-</span>
                                <input type="time" value={day.end_time} onChange={(e) => updateDay(index, 'end_time', e.target.value)} className="w-20 text-xs p-1 border rounded bg-gray-50"/>
                            </div>
                        )}
                    </div>
                ))}
                <button onClick={saveSchedule} disabled={processing} className="w-full mt-4 bg-black text-white py-3 rounded-xl font-bold">
                    {processing ? 'Saving...' : 'Update Schedule'}
                </button>
            </div>
        </div>
    );

    // --- MAIN RENDER ---
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* TOP HEADER */}
            <header className="bg-white px-6 pt-12 pb-4 sticky top-0 z-10 shadow-sm flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">FixMe<span className="text-blue-600">.</span></h1>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                        {profile?.business_name || user.name}
                    </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                    isOnSchedule ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'
                }`}>
                    {isOnSchedule ? '● Online' : '○ Offline'}
                </div>
            </header>

            {/* CONTENT AREA */}
            <main className="pt-6">
                {/* Only show the Title if we are NOT in the sub-list view (to keep it clean) */}
                {!(activeTab === 'jobs' && jobsSubView === 'list') && (
                    <div className="px-6 mb-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            {activeTab === 'jobs' && 'Job Dashboard'}
                            {activeTab === 'chats' && 'Messages'}
                            {activeTab === 'schedule' && 'Availability'}
                            {activeTab === 'profile' && 'My Profile'}
                        </h2>
                    </div>
                )}

                {/* JOBS TAB LOGIC */}
                {activeTab === 'jobs' && (
                    jobsSubView === 'menu' ? <JobsMenu /> : <JobsList />
                )}

                {activeTab === 'chats' && <ChatsView />}
                {activeTab === 'schedule' && <ScheduleView />}
                
                {activeTab === 'profile' && (
                    <div className="px-6 space-y-4 pb-24">
                        {/* Profile Content (Same as before) */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-gray-400 uppercase">Repairer Status</span>
                                {isOnSchedule 
                                    ? <span className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></span>
                                    : <span className="h-3 w-3 bg-red-400 rounded-full"></span>
                                }
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-1">
                                {isOnSchedule ? 'You are Online' : 'You are Offline'}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                {isOnSchedule 
                                    ? "You are visible to customers and can receive job requests." 
                                    : "Your schedule is currently disabled."}
                            </p>
                            {!isOnSchedule && (
                                <button onClick={() => setActiveTab('schedule')} className="w-full py-3 bg-black text-white font-bold rounded-xl text-sm">Go to Schedule</button>
                            )}
                        </div>

                        <div className="bg-white p-2 rounded-2xl border border-gray-100 space-y-1">
                            <button onClick={onSwitchToCustomer} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors group">
                                <span className="font-bold text-blue-600">Switch to Customer Mode</span>
                                <span className="text-gray-300 group-hover:text-blue-600">→</span>
                            </button>
                            <div className="h-px bg-gray-50 mx-4"></div>
                            <button onClick={onLogout} className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-50 rounded-xl transition-colors group">
                                <span className="font-bold text-gray-600 group-hover:text-red-600">Log Out</span>
                                <span className="text-gray-300 group-hover:text-red-600">→</span>
                            </button>
                        </div>
                         <div className="text-center text-[10px] text-gray-300 font-bold pt-4">FixMe Repairer App v1.0</div>
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

const NavButton = ({ icon, label, isActive, onClick, badge }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1 relative w-16">
        <span className={`text-xl transition-transform ${isActive ? 'scale-110' : 'opacity-50 grayscale'}`}>{icon}</span>
        <span className={`text-[10px] font-bold ${isActive ? 'text-black' : 'text-gray-400'}`}>{label}</span>
        {badge > 0 && (
            <span className="absolute -top-1 right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {badge}
            </span>
        )}
    </button>
);