import React from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function Dashboard() {
    // Access the authenticated user data shared by Laravel
    const { auth } = usePage().props;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            {/* Logo */}
                            <div className="flex-shrink-0 flex items-center">
                                <img
                                    className="block h-8 w-auto"
                                    src="/FixMeLogo.svg"
                                    alt="FixMe"
                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/64x64/0056b3/ffffff?text=F"; }}
                                />
                                <span className="ml-2 text-xl font-bold text-blue-600">Fix Me</span>
                            </div>
                        </div>
                        
                        {/* User Menu */}
                        <div className="flex items-center">
                            <div className="mr-4 text-sm text-gray-700">
                                Hello, <span className="font-semibold">{auth.user.name}</span>
                            </div>
                            
                            {/* Logout Button */}
                            <Link 
                                href="/logout" 
                                method="post" 
                                as="button" 
                                className="text-sm text-red-600 hover:text-red-800 font-medium border border-red-200 rounded px-3 py-1 hover:bg-red-50 transition"
                            >
                                Log Out
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Page Content */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                </div>
            </header>

            <main>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex flex-col items-center justify-center text-gray-400">
                            <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <span className="text-lg">Welcome to your Service Dashboard!</span>
                            <p className="text-sm mt-2">This is where your repair requests and listings will appear.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}