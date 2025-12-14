import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';

export default function RepairerMobile({ 
    user, 
    profile, 
    jobs = [], 
    schedule = [], 
    conversations = [], // 👈 NEW PROP
    isGoogleConnected = false,
    onApprove, 
    onReject,
    onSwitchToCustomer,
    onLogout
}) {
    // --- STATE MANAGEMENT ---
    
    // 1. Determine "Official" Schedule Status
    const [isOnSchedule, setIsOnSchedule] = useState(
        schedule && schedule.some(day => day.is_active)
    );

    const [activeTab, setActiveTab] = useState('jobs');

    // --- FORM LOGIC ---
    const { data, setData, put, processing } = useForm({
        schedule: (schedule && schedule.length > 0) ? schedule : [] 
    });

    // LOGIC: If Google is connected but user is "OFF SCHEDULE", force 'schedule' view.
    const currentView = (!isOnSchedule && isGoogleConnected) ? 'schedule' : activeTab;

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

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // --- RENDER HELPERS ---

    // 1. JOBS VIEW
    const renderJobsView = () => (
        <div className="animate-fade-in-up">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Incoming Requests</h2>
            
            {jobs.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                    <p className="text-sm">No new requests yet.</p>
                </div>
            ) : (
                jobs.map(job => (
                    <div key={job.id} className={`bg-white p-4 rounded-xl shadow-sm mb-4 border-l-4 ${job.status === 'pending' ? 'border-yellow-400' : 'border-green-500'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-gray-900">{job.service_type}</h3>
                                <p className="text-xs text-gray-500">
                                    {new Date(job.scheduled_at).toLocaleString('en-US', { 
                                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                                    })}
                                </p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                {job.status}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-8 w-8 bg-gray-100 rounded-full overflow-hidden">
                                <img src={`https://ui-avatars.com/api/?name=${job.customer?.name}&background=random`} className="h-full w-full object-cover" />
                            </div>
                            <div className="text-sm text-gray-600">
                                <span className="font-bold">{job.customer?.name || 'Guest'}</span>
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{job.problem_description || 'No details'}</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            {job.status === 'pending' && (
                                <>
                                    <button onClick={() => onReject(job.id)} className="flex-1 bg-white border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-bold hover:bg-gray-50">
                                        Decline
                                    </button>
                                    <button onClick={() => onApprove(job.id)} className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-bold hover:bg-gray-800">
                                        Accept & Sync
                                    </button>
                                </>
                            )}
                            {job.status === 'confirmed' && (
                                <button onClick={() => handleOpenChat(job.id)} className="w-full py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                                    <span>💬</span> Message Customer
                                </button>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    // 2. CHATS VIEW (NEW!)
    const renderChatsView = () => (
        <div className="animate-fade-in-up">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Messages</h2>
            <div className="space-y-3">
                {conversations.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-400 text-sm">No active conversations.</p>
                        <p className="text-[10px] text-gray-300 mt-1">Accept a job to start chatting.</p>
                    </div>
                ) : (
                    conversations.map((chat) => (
                        <div 
                            key={chat.id} 
                            onClick={() => handleOpenChat(chat.booking_id)}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 active:scale-95 transition-transform"
                        >
                            {/* Avatar */}
                            <div className="h-12 w-12 bg-gray-100 rounded-full overflow-hidden border border-gray-100 flex-shrink-0">
                                <img 
                                    src={`https://ui-avatars.com/api/?name=${chat.other_user_name}&background=random`} 
                                    alt="User" 
                                    className="h-full w-full object-cover"
                                />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-gray-900 truncate">{chat.other_user_name}</h3>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{chat.last_message_time || 'Just now'}</span>
                                </div>
                                
                                <div className="inline-flex items-center px-2 py-0.5 rounded text-blue-600 bg-blue-50 border border-blue-100 text-[10px] font-bold mb-1">
                                    Job #{chat.booking_id} • {chat.service_type}
                                </div>

                                <p className="text-sm text-gray-500 truncate">
                                    {chat.last_message_content || 'Chat started'}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    // 3. SCHEDULE VIEW
    const renderScheduleView = () => (
        <div className="pb-24 animate-fade-in-up">
            {!isOnSchedule ? (
                 <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-6">
                    <h2 className="text-lg font-bold text-yellow-800 mb-1">Set Working Hours</h2>
                    <p className="text-sm text-yellow-700">You are currently <strong>Off Schedule</strong>. Enable days to start receiving jobs.</p>
                 </div>
            ) : (
                <h2 className="text-lg font-bold text-gray-800 mb-4">Availability & Sync</h2>
            )}

            {!isGoogleConnected ? (
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6 text-center">
                    <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">📅</div>
                    <h3 className="font-bold text-gray-900 mb-1">Sync with Google Calendar</h3>
                    <a href="/auth/calendar/connect" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold mt-2">Connect Now</a>
                </div>
            ) : (
                isOnSchedule && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-xl mb-6 flex items-center gap-3">
                        <div className="bg-green-100 p-1 rounded-full">✓</div>
                        <p className="text-xs font-bold text-green-800">Google Calendar Synced</p>
                    </div>
                )
            )}

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">Weekly Hours</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {data.schedule.map((day, index) => (
                        <div key={day.day_of_week} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3 w-1/3">
                                <input 
                                    type="checkbox" 
                                    checked={day.is_active}
                                    onChange={(e) => updateDay(index, 'is_active', e.target.checked)}
                                    className="w-5 h-5 rounded text-black focus:ring-black"
                                />
                                <span className={`font-medium ${day.is_active ? 'text-gray-900' : 'text-gray-400'}`}>{DAYS[day.day_of_week]}</span>
                            </div>
                            
                            {day.is_active ? (
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="time" 
                                        value={day.start_time}
                                        onChange={(e) => updateDay(index, 'start_time', e.target.value)}
                                        className="bg-gray-50 border-gray-200 rounded-lg text-sm px-2 py-1"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input 
                                        type="time" 
                                        value={day.end_time}
                                        onChange={(e) => updateDay(index, 'end_time', e.target.value)}
                                        className="bg-gray-50 border-gray-200 rounded-lg text-sm px-2 py-1"
                                    />
                                </div>
                            ) : (
                                <span className="text-xs text-gray-400 italic">Unavailable</span>
                            )}
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-gray-50">
                    <button 
                        onClick={saveSchedule}
                        disabled={processing}
                        className="w-full bg-black text-white py-3 rounded-lg font-bold shadow-lg hover:bg-gray-800 disabled:opacity-50"
                    >
                        {processing ? 'Saving...' : (isOnSchedule ? 'Update Availability' : 'Set Schedule')}
                    </button>
                </div>
            </div>
        </div>
    );

    // 🛑 ONBOARDING STEP 1: Google Calendar Check
    if (!isGoogleConnected) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mb-6">📅</div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Welcome to FixMe!</h1>
                <p className="text-gray-500 mb-8">To prevent double-bookings, connect your Google Calendar first.</p>
                <a href="/auth/calendar/connect" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all">
                    Connect Google Calendar
                </a>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            {/* Header */}
            <header className="bg-white p-5 sticky top-0 z-10 shadow-sm rounded-b-3xl flex justify-between items-center">
                 <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Work Mode</p>
                    <h1 className="text-xl font-black text-gray-800">
                        {currentView === 'jobs' ? profile?.business_name : 
                         currentView === 'chats' ? 'My Messages' : 'Schedule'}
                    </h1>
                 </div>
                 
                 {/* Status Badge */}
                 {isOnSchedule ? (
                    <button className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase">ON SCHEDULE</button>
                 ) : (
                    <button className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase">OFF SCHEDULE</button>
                 )}
            </header>

            {/* Main Content */}
            <main className="px-5 mt-6">
                {currentView === 'jobs' && renderJobsView()}
                {currentView === 'chats' && renderChatsView()}
                {currentView === 'schedule' && renderScheduleView()}
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 py-3 px-6 flex justify-between items-center text-xs font-medium text-gray-400 z-50 pb-safe">
                
                {/* 1. JOBS */}
                <button 
                    onClick={() => isOnSchedule && setActiveTab('jobs')}
                    className={`flex flex-col items-center gap-1 ${currentView === 'jobs' ? 'text-black' : (isOnSchedule ? 'hover:text-gray-600' : 'opacity-30 cursor-not-allowed')}`}
                >
                    <svg className="w-6 h-6" fill={currentView === 'jobs' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    Jobs
                </button>

                {/* 2. CHATS (NEW!) */}
                <button 
                    onClick={() => isOnSchedule && setActiveTab('chats')}
                    className={`flex flex-col items-center gap-1 ${currentView === 'chats' ? 'text-black' : (isOnSchedule ? 'hover:text-gray-600' : 'opacity-30 cursor-not-allowed')}`}
                >
                    <div className="relative">
                        <svg className="w-6 h-6" fill={currentView === 'chats' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {/* Red Dot if Unread (Optional Logic) */}
                        {conversations.some(c => c.unread_count > 0) && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                        )}
                    </div>
                    Chats
                </button>

                {/* 3. SCHEDULE */}
                <button 
                    onClick={() => setActiveTab('schedule')}
                    className={`flex flex-col items-center gap-1 ${currentView === 'schedule' ? 'text-black' : 'hover:text-gray-600'}`}
                >
                    <svg className="w-6 h-6" fill={currentView === 'schedule' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Schedule
                </button>

                {/* 4. SWITCH */}
                <button 
                    onClick={onSwitchToCustomer}
                    className="flex flex-col items-center gap-1 text-blue-600"
                >
                     <div className="bg-blue-50 p-0.5 rounded-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                     </div>
                    Switch
                </button>

                {/* 5. LOGOUT */}
                <button onClick={onLogout} className="flex flex-col items-center gap-1 hover:text-red-500 text-gray-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Logout
                </button>
            </nav>
        </div>
    );
}