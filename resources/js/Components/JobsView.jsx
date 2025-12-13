import React, { useState } from 'react';
import { router } from '@inertiajs/react';

export default function JobsView({ jobs = [] }) {
    
    // 1. Filter the jobs logic
    const pendingJobs = jobs.filter(job => job.status === 'pending');
    const upcomingJobs = jobs.filter(job => job.status === 'confirmed');

    // 2. Handlers for buttons
    const handleAccept = (jobId) => {
        if (confirm("Accept this job and sync to calendar?")) {
            router.post(`/bookings/${jobId}/approve`);
        }
    };

    const handleReject = (jobId) => {
        if (confirm("Are you sure you want to decline?")) {
            router.post(`/bookings/${jobId}/reject`);
        }
    };

    // 3. Helper for Date Formatting
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-8">
            
            {/* SECTION A: NEW REQUESTS */}
            <div>
                <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                    <span className="bg-red-500 w-2 h-2 rounded-full animate-pulse"></span>
                    New Requests
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{pendingJobs.length}</span>
                </h2>

                {pendingJobs.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-400 text-sm">No new requests right now.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pendingJobs.map(job => (
                            <div key={job.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{job.customer?.name || 'Customer'}</h3>
                                        <p className="text-sm text-blue-600 font-medium">{job.service_type}</p>
                                    </div>
                                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold">
                                        {formatDate(job.scheduled_at)}
                                    </div>
                                </div>
                                
                                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg mb-4">
                                    "{job.problem_description}"
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => handleReject(job.id)}
                                        className="py-3 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                                    >
                                        Decline
                                    </button>
                                    <button 
                                        onClick={() => handleAccept(job.id)}
                                        className="py-3 text-sm font-bold text-white bg-black hover:bg-gray-800 rounded-lg shadow-lg"
                                    >
                                        Accept Job
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SECTION B: UPCOMING SCHEDULE */}
            <div>
                <h2 className="text-lg font-black text-gray-900 mb-4">Upcoming Schedule</h2>
                
                {upcomingJobs.length === 0 ? (
                    <div className="p-4 text-sm text-gray-400 italic">No upcoming jobs confirmed.</div>
                ) : (
                    <div className="space-y-3">
                        {upcomingJobs.map(job => (
                            <div key={job.id} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100">
                                {/* Date Box */}
                                <div className="bg-gray-100 p-3 rounded-lg text-center min-w-[60px]">
                                    <div className="text-xs font-bold text-gray-400 uppercase">
                                        {new Date(job.scheduled_at).toLocaleDateString('en-US', { month: 'short' })}
                                    </div>
                                    <div className="text-lg font-black text-gray-900">
                                        {new Date(job.scheduled_at).getDate()}
                                    </div>
                                </div>

                                {/* Info */}
                                <div>
                                    <h4 className="font-bold text-gray-900">{job.customer?.name}</h4>
                                    <p className="text-xs text-gray-500">
                                        {new Date(job.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} • {job.service_type}
                                    </p>
                                </div>

                                {/* Status Badge */}
                                <div className="ml-auto">
                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                        Confirmed
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}