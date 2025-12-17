import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';

export default function RepairerDesktop({ 
    user, 
    profile, 
    jobs = [], // Ensure these job objects have a 'price' field!
    schedule = [], 
    conversations = [], 
    isGoogleConnected, 
    onSwitchToCustomer,
    onApprove, 
    onReject,
    onComplete, 
    onLogout 
}) {
    // ... (Keep existing State & Form Logic same as before) ...
    const [isOnSchedule, setIsOnSchedule] = useState(
        schedule && schedule.some(day => day.is_active)
    );
    const [activeTab, setActiveTab] = useState('jobs'); 
    const [jobsSubView, setJobsSubView] = useState('menu'); 
    const [selectedStatus, setSelectedStatus] = useState('pending');

    const { data, setData, put, processing } = useForm({
        schedule: (schedule && schedule.length > 0) ? schedule : [] 
    });

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

    const handleOpenJobList = (status) => {
        setSelectedStatus(status);
        setJobsSubView('list');
    };

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // --- SUB-COMPONENTS ---
    
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

    // 1. JOBS MENU (Cards + Next Up + Price)
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

                {/* 2. NEXT SCHEDULED JOB BANNER (With Price!) */}
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
                                {/* 💰 EARNINGS BADGE */}
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                                    💰 Est. Earnings: ${nextJob.price || '0.00'}
                                </span>
                            </div>
                        </div>

                        <button 
                            onClick={() => handleOpenJobList('confirmed')}
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

    // 2. JOBS LIST (THE TABLE - NOW WITH PRICE)
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
                            <th className="px-6 py-4">Price</th> {/* 👈 NEW COLUMN */}
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredJobs.map(job => (
                            <tr key={job.id} className="hover:bg-gray-50 transition-colors">
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
                                {/* 💰 PRICE DATA */}
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
                                    {job.status === 'pending' && (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => onReject(job.id)} className="px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded border border-red-200">Decline</button>
                                            <button onClick={() => onApprove(job.id)} className="px-4 py-1 text-xs font-bold bg-black text-white rounded hover:bg-gray-800 shadow-sm">Accept</button>
                                        </div>
                                    )}
                                    {job.status === 'confirmed' && (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenChat(job.id)} className="px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200">
                                                Message
                                            </button>
                                            <button onClick={() => onComplete(job.id)} className="px-4 py-1 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded shadow-sm">
                                                Complete
                                            </button>
                                        </div>
                                    )}
                                    {job.status === 'completed' && (
                                        <span className="text-xs font-bold text-gray-400">Job Done</span>
                                    )}
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

    // ... (ChatsView, ScheduleView, etc. remain the same) ...
    // Keeping them concise here to save space, but ensure you include them from the previous complete snippet!
    
    // 3. Messages List View
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

    // 4. Schedule View
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

    // 🛑 BLOCKING VIEW: GOOGLE CALENDAR
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
                        <SidebarItem id="earnings" label="Earnings" icon="💰" disabled={!isOnSchedule} />
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
                {/* Hide header if drilling down into list */}
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