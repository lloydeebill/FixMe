import React, { useState } from 'react';
import { router } from '@inertiajs/react';

export default function RepairerDesktop({ 
    user, 
    profile, 
    jobs = [],     // <--- Safety default
    schedule = [], // <--- Safety default
    isGoogleConnected, 
    onSwitchToCustomer 
}) {
    const [activeTab, setActiveTab] = useState('jobs'); // 'jobs', 'schedule', 'earnings'

    // --- ACTIONS (Same logic as Mobile) ---
    const handleApprove = (id) => {
        router.post(`/bookings/${id}/approve`, {}, {
            preserveScroll: true,
            onSuccess: () => alert("Job Accepted!")
        });
    };

    const handleReject = (id) => {
        if (confirm('Reject this job?')) {
             router.post(`/bookings/${id}/reject`, {}, { preserveScroll: true });
        }
    };

    // --- SUB-COMPONENTS ---
    
    // 1. Sidebar Button
    const SidebarItem = ({ id, label, icon }) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${
                activeTab === id 
                ? 'bg-black text-white shadow-lg' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
        >
            <span className="text-xl">{icon}</span>
            {label}
        </button>
    );

    // 2. Jobs Table View (Desktop Specific)
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
                    {/* Safety check: jobs might be empty initially */}
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
                                        <button 
                                            onClick={() => handleReject(job.id)}
                                            className="px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded"
                                        >
                                            Decline
                                        </button>
                                        <button 
                                            onClick={() => handleApprove(job.id)}
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

    // 3. Simple Schedule View (Desktop Specific)
    const ScheduleView = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sync Status Card */}
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

            {/* Shift List (Read Only View for Desktop) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-4">Weekly Availability</h3>
                <div className="space-y-2">
                    {schedule.map((day) => (
                        <div key={day.day_of_week} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg">
                            {/* We use a helper array to convert 0->Sun, 1->Mon */}
                            <span className="font-bold w-12">
                                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day.day_of_week]}
                            </span>
                            
                            {day.is_active ? (
                                <div className="flex gap-2">
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                        {day.start_time?.slice(0,5)} - {day.end_time?.slice(0,5)}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-xs text-gray-400 italic">Unavailable</span>
                            )}
                        </div>
                    ))}
                    {schedule.length === 0 && <p className="text-gray-400 text-sm">No schedule set yet.</p>}
                </div>
            </div>
        </div>
    );

    // --- MAIN LAYOUT ---
    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            
            {/* LEFT SIDEBAR */}
            <aside className="w-64 bg-white border-r border-gray-200 fixed h-full p-6 flex flex-col justify-between">
                <div>
                    <div className="mb-8 px-4">
                        <h1 className="text-2xl font-black tracking-tight">Fixr<span className="text-blue-600">.</span></h1>
                        <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wider">Repairer Pro</p>
                    </div>
                    
                    <nav className="space-y-2">
                        <SidebarItem id="jobs" label="Job Requests" icon="⚡" />
                        <SidebarItem id="schedule" label="Schedule" icon="📅" />
                        <SidebarItem id="earnings" label="Earnings" icon="💰" />
                    </nav>
                </div>

                {/* Bottom Profile / Switch */}
                <div className="border-t border-gray-100 pt-6">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        {/* Avatar Fallback */}
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 text-sm">
                            {user.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate">{profile?.business_name || user.name}</p>
                            <p className="text-xs text-green-600 font-bold">● Online</p>
                        </div>
                    </div>
                    <button 
                        onClick={onSwitchToCustomer}
                        className="w-full text-center text-xs font-bold text-gray-400 hover:text-black py-2 transition-colors"
                    >
                        Switch to Customer Mode
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {activeTab === 'jobs' && 'Overview'}
                            {activeTab === 'schedule' && 'My Schedule'}
                            {activeTab === 'earnings' && 'Financials'}
                        </h1>
                        <p className="text-gray-500 text-sm">Welcome back, {user.name}</p>
                    </div>
                </header>

                {/* Content Switching */}
                {activeTab === 'jobs' && <JobsView />}
                {activeTab === 'schedule' && <ScheduleView />}
                {activeTab === 'earnings' && <div className="text-center py-20 text-gray-400">Earnings Chart Coming Soon</div>}
            </main>
        </div>
    );
}