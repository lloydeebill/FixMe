import React, { useState } from 'react';
import { useForm } from '@inertiajs/react'; // Import this for the form handling

export default function RepairerMobile({ 
    user, 
    profile, 
    jobs, 
    earnings, 
    onAccept, 
    onDecline, 
    onSwitchToCustomer,
    // NEW PROPS needed from the backend:
    schedule = [], 
    isGoogleConnected = false 
}) {
    // State to toggle between "Jobs" view and "Schedule" view
    const [activeTab, setActiveTab] = useState('jobs'); // 'jobs', 'schedule', 'profile'

    // --- FORM LOGIC FOR AVAILABILITY ---
    const { data, setData, put, processing, recentlySuccessful } = useForm({
        schedule: schedule.length > 0 ? schedule : []
    });

    const updateDay = (index, field, value) => {
        const newSchedule = [...data.schedule];
        newSchedule[index][field] = value;
        setData('schedule', newSchedule);
    };

    const saveSchedule = () => {
        put(route('availability.update'), {
            preserveScroll: true,
        });
    };

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // --- RENDER HELPERS ---
    
    // 1. The Jobs View (What you already had)
    const renderJobsView = () => (
        <>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Incoming Requests</h2>
            {jobs.map(job => (
                <div key={job.id} className="bg-white p-4 rounded-xl shadow-sm mb-4">
                    <h3 className="font-bold">{job.type}</h3>
                    <p className="text-sm text-gray-500">{job.desc}</p>
                    <div className="mt-3 flex gap-2">
                        <button onClick={() => onAccept(job.id)} className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-bold">Accept</button>
                    </div>
                </div>
            ))}
            {jobs.length === 0 && (
                <div className="text-center py-10 text-gray-400">No active jobs right now.</div>
            )}
        </>
    );

    // 2. The New Schedule View
    const renderScheduleView = () => (
        <div className="space-y-6">
            
            {/* GOOGLE CALENDAR CARD */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-gray-800">Google Calendar</h3>
                    {isGoogleConnected && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">SYNCED</span>}
                </div>
                <p className="text-xs text-gray-500 mb-4">Sync to prevent double booking.</p>
                
                {!isGoogleConnected ? (
                    <a 
                        href="/auth/calendar/connect"// The route we created earlier
                        className="flex items-center justify-center w-full py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50"
                    >
                         <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4 mr-2" />
                        Connect Calendar
                    </a>
                ) : (
                    <div className="text-xs text-green-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Connected to your account
                    </div>
                )}
            </div>

            {/* AVAILABILITY FORM */}
            <div className="bg-white p-5 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">Weekly Hours</h3>
                    {recentlySuccessful && <span className="text-xs text-green-600">Saved!</span>}
                </div>

                <div className="space-y-4">
                    {data.schedule.map((day, index) => (
                        <div key={day.day_of_week} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0">
                            
                            {/* Toggle & Name */}
                            <div className="flex items-center gap-3">
                                <div 
                                    onClick={() => updateDay(index, 'is_active', !day.is_active)}
                                    className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${day.is_active ? 'bg-black' : 'bg-gray-200'}`}
                                >
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${day.is_active ? 'translate-x-4' : ''}`}></div>
                                </div>
                                <span className={`text-sm font-bold ${day.is_active ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {DAYS[day.day_of_week]}
                                </span>
                            </div>

                            {/* Time Inputs */}
                            {day.is_active ? (
                                <div className="flex gap-1 text-sm">
                                    <input 
                                        type="time" 
                                        value={day.start_time}
                                        onChange={(e) => updateDay(index, 'start_time', e.target.value)}
                                        className="border-gray-200 rounded px-1 py-0 text-xs focus:ring-0 focus:border-black"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input 
                                        type="time" 
                                        value={day.end_time}
                                        onChange={(e) => updateDay(index, 'end_time', e.target.value)}
                                        className="border-gray-200 rounded px-1 py-0 text-xs focus:ring-0 focus:border-black"
                                    />
                                </div>
                            ) : (
                                <span className="text-xs text-gray-300 uppercase font-bold tracking-wide">Closed</span>
                            )}
                        </div>
                    ))}
                </div>

                <button 
                    onClick={saveSchedule}
                    disabled={processing}
                    className="w-full mt-6 bg-black text-white py-3 rounded-xl font-bold text-sm disabled:opacity-50"
                >
                    {processing ? 'Saving...' : 'Update Schedule'}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            
            {/* Header */}
            <header className="bg-white p-5 sticky top-0 z-10 shadow-sm rounded-b-3xl">
                 <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-black text-gray-800">
                        {activeTab === 'jobs' ? profile?.business_name : 'My Schedule'}
                    </h1>
                    <button className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">ONLINE</button>
                 </div>
            </header>

            {/* Main Content Area */}
            <main className="px-5 mt-6">
                {activeTab === 'jobs' && renderJobsView()}
                {activeTab === 'schedule' && renderScheduleView()}
                {activeTab === 'profile' && <div className="text-center py-10 text-gray-400">Profile Settings (Coming Soon)</div>}
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 py-3 px-6 flex justify-between items-center text-xs font-medium text-gray-400 z-50">
                
                {/* TAB 1: JOBS */}
                <button 
                    onClick={() => setActiveTab('jobs')}
                    className={`flex flex-col items-center ${activeTab === 'jobs' ? 'text-black' : 'hover:text-gray-600'}`}
                >
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    Jobs
                </button>

                {/* TAB 2: SCHEDULE (Replaces Customer Mode in the center slot if you prefer, or add as 4th) */}
                {/* I kept customer mode as a clear "Switch" action, and added Schedule as a main tab */}
                
                <button 
                    onClick={() => setActiveTab('schedule')}
                    className={`flex flex-col items-center ${activeTab === 'schedule' ? 'text-black' : 'hover:text-gray-600'}`}
                >
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Schedule
                </button>

                {/* TAB 3: CUSTOMER MODE SWITCH */}
                <button 
                    onClick={onSwitchToCustomer}
                    className="flex flex-col items-center text-blue-600"
                >
                     <div className="bg-blue-50 p-1 rounded-full mb-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                     </div>
                    Switch
                </button>
            </nav>
        </div>
    );
}