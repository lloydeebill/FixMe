import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Settings() {
    // Get the logged-in user from the backend
    const { auth } = usePage().props;
    const user = auth.user;

    return (
        <AuthenticatedLayout
            user={user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Account Settings</h2>}
        >
            <Head title="Settings" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    
                    {/* 1. PROFILE INFORMATION CARD */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Profile Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Full Name</label>
                                <p className="mt-1 text-lg font-semibold text-gray-900">{user.name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Email Address</label>
                                <p className="mt-1 text-lg font-semibold text-gray-900">{user.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* 2. REPAIRER STATUS CARD */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Professional Status</h3>
                        
                        <div className="mt-4">
                            {user.isRepairer ? (
                                // A. IF USER IS ALREADY A REPAIRER
                                <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-start gap-4">
                                    <div className="bg-green-100 p-3 rounded-full text-green-600 shrink-0">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-green-900 text-lg">You are a Verified Repairer</h4>
                                        <p className="text-green-700 mt-1">
                                            Your profile is active and visible to customers in your area.
                                        </p>
                                        <div className="mt-4">
                                            <button className="text-green-700 font-semibold text-sm hover:underline">
                                                Edit Repairer Profile &rarr;
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // B. IF USER IS JUST A CUSTOMER
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div>
                                            <h4 className="font-bold text-blue-900 text-lg mb-2">Join the FixMe Pros</h4>
                                            <p className="text-blue-700 max-w-xl">
                                                Do you have skills in plumbing, electrical work, or carpentry? 
                                                Register as a repairer today to start receiving job requests and earning money.
                                            </p>
                                        </div>
                                        
                                        {/* This Link points to the route we created: /become-repairer */}
                                        <Link
                                            href={route('repairer.create')}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition transform active:scale-95 shrink-0 whitespace-nowrap"
                                        >
                                            Become a Repairer
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. LOGOUT BUTTON (Optional Red Zone) */}
                    <div className="flex justify-end">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="text-red-600 font-semibold hover:text-red-800 transition text-sm"
                        >
                            Log Out
                        </Link>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}