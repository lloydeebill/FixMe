import React, { useState } from 'react';

// 🚨 1. Add 'onSwitchToCustomer' to props
export default function RepairerMobile({ user, profile, jobs, earnings, onAccept, onDecline, onSwitchToCustomer }) {
    const [isOnline, setIsOnline] = useState(true);

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            
            {/* ... Header & Body (Keep existing code) ... */}
            <header className="bg-white p-5 sticky top-0 z-10 shadow-sm rounded-b-3xl">
                 <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-black text-gray-800">{profile?.business_name}</h1>
                    <button className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">ONLINE</button>
                 </div>
            </header>

            <main className="px-5 mt-6">
                {/* Job List Code... */}
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
            </main>

            {/* --- BOTTOM NAV (Sticky) --- */}
            <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 py-3 px-6 flex justify-between items-center text-xs font-medium text-gray-400 z-50">
                <button className="flex flex-col items-center text-blue-600">
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    Jobs
                </button>

                <button 
                    onClick={onSwitchToCustomer}
                    className="flex flex-col items-center hover:text-gray-800"
                >
                    <div className="bg-gray-100 p-2 rounded-full -mt-6 border-4 border-gray-50">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    </div>
                    <span className="mt-1">Customer Mode</span>
                </button>

                <button className="flex flex-col items-center hover:text-gray-800">
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Profile
                </button>
            </nav>
        </div>
    );
}