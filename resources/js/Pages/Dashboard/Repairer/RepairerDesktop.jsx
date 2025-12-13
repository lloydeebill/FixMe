import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';

export default function RepairerDesktop({ 
    user, 
    profile, 
    jobs = [], 
    schedule = [], 
    isGoogleConnected, 
    onSwitchToCustomer,
    onApprove, 
    onReject,
    onLogout 
}) {
    // --- STATE MANAGEMENT ---

    // 1. Determine "Official" Schedule Status (Based on SAVED data)
    const [isOnSchedule, setIsOnSchedule] = useState(
        schedule && schedule.some(day => day.is_active)
    );

    const [activeTab, setActiveTab] = useState('jobs'); 

    // --- FORM LOGIC ---
    const { data, setData, put, processing } = useForm({
        schedule: (schedule && schedule.length > 0) ? schedule : [] 
    });

    // 2. LOGIC: Force 'schedule' view if Google is connected but user is "OFF SCHEDULE"
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
                // 1. Calculate NEW status based on what was just saved
                const newStatus = data.schedule.some(day => day.is_active);
                
                // 2. Update OFFICIAL status (Flips the badge)
                setIsOnSchedule(newStatus);

                // 3. Handle Navigation
                if (currentView === 'schedule' && newStatus) {
                    setActiveTab('jobs'); 
                    alert('Setup Complete! You are now ON SCHEDULE.');
                } else {
                    alert('Availability Saved!');
                }
            }
        });
    };

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // --- SUB-COMPONENTS ---
    
    // 1. Sidebar Button (Now handles Disabled State)
    const SidebarItem = ({ id, label, icon, disabled }) => (
        <button 
            onClick={() => !disabled && setActiveTab(id)}
            disabled={disabled}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${
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
        </button>
    );

    // 2. Jobs Table View
    const JobsView = () => (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Job Requests</h2>
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                    {jobs.filter(j => j.status === 'pending').length} Pending
                </span>
            </div>
            
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                    <tr>
                        <th className="px-6 py-4">Service</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Date & Time</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {jobs.map(job => (
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
                            <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                    job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                    job.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {job.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                {job.status === 'pending' && (
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => onReject(job.id)}
                                            className="px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded"
                                        >
                                            Decline
                                        </button>
                                        <button 
                                            onClick={() => onApprove(job.id)}
                                            className="px-4 py-1 text-xs font-bold bg-black text-white rounded hover:bg-gray-800"
                                        >
                                            Accept
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                    {jobs.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                No job requests found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    // 3. Schedule View
    const ScheduleView = () => (
        <>
             {/* Header Alert if Off Schedule */}
             {!isOnSchedule && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-6 flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <h2 className="text-sm font-bold text-yellow-800">Action Required: Set Working Hours</h2>
                        <p className="text-xs text-yellow-700">You are currently <strong>Off Schedule</strong>. You must enable at least one day and click save to start receiving jobs.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Column: Calendar Sync Info */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                    <h3 className="font-bold text-lg mb-2">Calendar Sync</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Connect your Google Calendar to automatically block off times when you are busy.
                    </p>
                    {isGoogleConnected ? (
                        <div className="flex items-center gap-2 text-green-700 font-bold bg-green-50 p-3 rounded-lg">
                            <span>✓</span> Google Calendar Connected
                        </div>
                    ) : (
                        <a href="/auth/calendar/connect" className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">
                            Connect Google Calendar
                        </a>
                    )}
                </div>

                {/* Right Column: INTERACTIVE Schedule Editor */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-gray-800">Weekly Availability</h3>
                        {processing && <span className="text-xs text-gray-400 animate-pulse">Saving...</span>}
                    </div>
                    
                    <div className="divide-y divide-gray-100">
                        {data.schedule.map((day, index) => (
                            <div key={day.day_of_week} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                
                                {/* Checkbox & Day Name */}
                                <div className="flex items-center gap-4 w-1/3">
                                    <input 
                                        type="checkbox" 
                                        checked={day.is_active}
                                        onChange={(e) => updateDay(index, 'is_active', e.target.checked)}
                                        className="w-5 h-5 rounded text-black focus:ring-black border-gray-300 cursor-pointer"
                                    />
                                    <span className={`font-bold ${day.is_active ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {DAYS[day.day_of_week]}
                                    </span>
                                </div>
                                
                                {/* Time Inputs */}
                                <div className="flex-1 flex justify-end">
                                    {day.is_active ? (
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="time" 
                                                value={day.start_time}
                                                onChange={(e) => updateDay(index, 'start_time', e.target.value)}
                                                className="bg-white border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-black focus:border-black"
                                            />
                                            <span className="text-gray-400 font-bold">-</span>
                                            <input 
                                                type="time" 
                                                value={day.end_time}
                                                onChange={(e) => updateDay(index, 'end_time', e.target.value)}
                                                className="bg-white border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-black focus:border-black"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-400 italic py-2">Unavailable</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Save Button */}
                    <div className="p-6 bg-gray-50 border-t border-gray-100">
                        <button 
                            onClick={saveSchedule}
                            disabled={processing}
                            className="w-full bg-black text-white py-3 rounded-xl font-bold shadow-lg hover:bg-gray-800 disabled:opacity-50 transition-all transform active:scale-95"
                        >
                            {processing ? 'Saving...' : (isOnSchedule ? 'Update Availability' : 'Set Schedule & Go Online')}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );

    // 🛑 BLOCKING VIEW: GOOGLE CALENDAR (Step 1)
    if (!isGoogleConnected) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-10 rounded-2xl shadow-xl max-w-lg text-center border border-gray-100">
                    <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                        📅
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-3">One Last Step!</h1>
                    <p className="text-gray-500 mb-8 text-lg">
                        Welcome to the Pro Team, <strong>{user.name}</strong>.<br/>
                        Please connect your Google Calendar to synchronize your availability.
                    </p>
                    <a href="/auth/calendar/connect" className="block w-full bg-black text-white text-lg font-bold py-4 rounded-xl hover:bg-gray-800 transition-transform hover:scale-105">
                        Connect Calendar & Continue →
                    </a>
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
                        <h1 className="text-2xl font-black tracking-tight">Fixr<span className="text-blue-600">.</span></h1>
                        <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wider">Repairer Pro</p>
                    </div>
                    
                    <nav className="space-y-2">
                        {/* If !isOnSchedule (and forced to schedule view), 
                           Jobs and Earnings are DISABLED 
                        */}
                        <SidebarItem 
                            id="jobs" 
                            label="Job Requests" 
                            icon="⚡" 
                            disabled={!isOnSchedule} 
                        />
                        <SidebarItem 
                            id="schedule" 
                            label="Schedule" 
                            icon="📅" 
                            disabled={false} 
                        />
                        <SidebarItem 
                            id="earnings" 
                            label="Earnings" 
                            icon="💰" 
                            disabled={!isOnSchedule} 
                        />
                    </nav>
                </div>

                {/* Bottom Profile / Switch / Logout */}
                <div className="border-t border-gray-100 pt-6 space-y-3">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 text-sm">
                            {user.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate">{profile?.business_name || user.name}</p>
                            
                            {/* DYNAMIC BADGE */}
                            {isOnSchedule ? (
                                <p className="text-[10px] text-green-600 font-black tracking-wide uppercase">● On Schedule</p>
                            ) : (
                                <p className="text-[10px] text-red-600 font-black tracking-wide uppercase">● Off Schedule</p>
                            )}
                        </div>
                    </div>
                    
                    <button 
                        onClick={onSwitchToCustomer}
                        className="w-full text-center text-xs font-bold text-blue-600 hover:text-blue-800 py-2 border border-blue-100 rounded-lg transition-colors"
                    >
                        Switch to Customer
                    </button>

                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-red-600 py-2 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3V7a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Log Out
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {currentView === 'jobs' && 'Overview'}
                            {currentView === 'schedule' && 'My Schedule'}
                            {currentView === 'earnings' && 'Financials'}
                        </h1>
                        <p className="text-gray-500 text-sm">Welcome back, {user.name}</p>
                    </div>
                </header>

                {currentView === 'jobs' && <JobsView />}
                {currentView === 'schedule' && <ScheduleView />}
                {currentView === 'earnings' && <div className="text-center py-20 text-gray-400">Earnings Chart Coming Soon</div>}
            </main>
        </div>
    );
}