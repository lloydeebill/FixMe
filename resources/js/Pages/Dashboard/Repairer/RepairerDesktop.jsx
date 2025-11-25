import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// 🚨 1. Add 'onSwitchToCustomer' to the props here
export default function RepairerDesktop({ user, profile, jobs, earnings, onAccept, onDecline, onSwitchToCustomer }) {
    return (
        <AuthenticatedLayout
            user={user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Professional Dashboard</h2>}
        >
            <div className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* ... Stats Grid ... */}
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        {/* (Keep your stats code here) */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                             <h3 className="text-gray-500 text-sm font-bold uppercase">Total Earnings</h3>
                             <p className="text-3xl font-black text-gray-900 mt-2">₱ {earnings.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                            <h3 className="text-gray-500 text-sm font-bold uppercase">Completed Jobs</h3>
                            <p className="text-3xl font-black text-gray-900 mt-2">{profile?.clients_helped || 12}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
                            <h3 className="text-gray-500 text-sm font-bold uppercase">Rating</h3>
                             <div className="flex items-center mt-2">
                                <span className="text-3xl font-black text-gray-900">{profile?.rating || '4.9'}</span>
                                <span className="ml-2 text-yellow-400 text-xl">★★★★★</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* ... Job List (Left Column) ... */}
                        <div className="lg:col-span-2">
                            {/* (Keep your job list code here) */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="font-bold text-lg text-gray-800">Job Requests</h3>
                                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">{jobs.length} Active</span>
                                </div>
                                <div className="p-6 text-gray-500">
                                    {/* Simplified list for brevity */}
                                    {jobs.map(job => (
                                        <div key={job.id} className="mb-4 p-4 border rounded-lg flex justify-between items-center">
                                            <span>{job.type} - {job.desc}</span>
                                            <button onClick={() => onAccept(job.id)} className="bg-black text-white px-3 py-1 rounded">Accept</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* --- RIGHT COLUMN --- */}
                        <div className="space-y-6">
                            
                            {/* 🚨 2. THIS IS THE FIXED BUTTON 🚨 */}
                            <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg">
                                <h3 className="font-bold text-lg mb-2">Switch to Customer Mode?</h3>
                                <p className="text-blue-100 text-sm mb-4">Need to hire someone else for a job? Switch back to find help.</p>
                                
                                <button 
                                    onClick={onSwitchToCustomer}
                                    className="block w-full text-center bg-white text-blue-600 font-bold py-2 rounded-lg hover:bg-blue-50 transition"
                                >
                                    Go to Customer Dashboard
                                </button>
                            </div>

                            {/* Reviews Widget (Keep existing) */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-4">Recent Reviews</h3>
                                <p className="text-gray-500 text-sm">No reviews yet.</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}