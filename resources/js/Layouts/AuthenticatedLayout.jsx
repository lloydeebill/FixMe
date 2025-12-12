import React, { useState } from 'react';
import { Link } from '@inertiajs/react';

export default function AuthenticatedLayout({ user, header, children }) {
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    return (
        <div className="min-h-screen bg-gray-100">
            {/* --- TOP NAVIGATION BAR --- */}
            <nav className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        
                        {/* LEFT SIDE: Logo & Links */}
                        <div className="flex">
                            {/* Logo */}
                            <div className="shrink-0 flex items-center">
                                <Link href="/app"> {/* ✅ FIXED: Points to /app */}
                                    <h1 className="text-2xl font-black text-blue-600 tracking-tighter">
                                        FixMe.
                                    </h1>
                                </Link>
                            </div>

                            {/* Navigation Links (Desktop) */}
                            <div className="hidden space-x-8 sm:-my-px sm:ml-10 sm:flex">
                                
                                {/* 1. DASHBOARD LINK */}
                                <Link
                                    href="/app" // ✅ FIXED: Changed from /dashboard to /app
                                    className="inline-flex items-center px-1 pt-1 border-b-2 border-blue-500 text-sm font-medium leading-5 text-gray-900 focus:outline-none transition duration-150 ease-in-out"
                                >
                                    Dashboard
                                </Link>

                                {/* 2. BECOME A PRO LINK (Only for Customers) */}
                                {!user.isRepairer && (
                                    <Link
                                        href="/become-repairer"
                                        className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500 text-sm font-bold leading-5 text-blue-600 hover:text-blue-800 transition duration-150 ease-in-out"
                                    >
                                        Become a Pro
                                    </Link>
                                )}

                                {/* 3. WORK MODE BADGE (Only for Repairers) */}
                                {user.isRepairer === 1 && (
                                    <span className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium leading-5 text-green-600">
                                        ✅ Repairer Account
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* RIGHT SIDE: User Dropdown / Logout */}
                        <div className="hidden sm:flex sm:items-center sm:ml-6">
                            <div className="ml-3 relative group">
                                <div className="flex items-center gap-2 cursor-pointer">
                                    <span className="text-sm font-medium text-gray-500">
                                        {user?.name}
                                    </span>
                                    <svg className="ml-2 -mr-0.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>

                                {/* Simple Hover Dropdown */}
                                <div className="absolute right-0 w-48 mt-2 py-2 bg-white rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Log Out
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* HAMBURGER MENU (Mobile Fallback) */}
                        <div className="-mr-2 flex items-center sm:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown((previousState) => !previousState)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none transition duration-150 ease-in-out"
                            >
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path
                                        className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* MOBILE MENU */}
                <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden'}>
                    <div className="pt-2 pb-3 space-y-1">
                        <Link
                            href="/app" // ✅ FIXED: Changed from /dashboard to /app
                            className="block w-full pl-3 pr-4 py-2 border-l-4 border-blue-400 text-left text-base font-medium text-blue-700 bg-blue-50 focus:outline-none transition duration-150 ease-in-out"
                        >
                            Dashboard
                        </Link>

                        {/* Mobile "Become a Pro" Link */}
                        {!user.isRepairer && (
                            <Link
                                href="/become-repairer"
                                className="block w-full pl-3 pr-4 py-2 border-l-4 border-transparent text-left text-base font-bold text-gray-600 hover:text-blue-600 hover:bg-gray-50 hover:border-gray-300 focus:outline-none transition duration-150 ease-in-out"
                            >
                                Become a Pro
                            </Link>
                        )}
                    </div>

                    <div className="pt-4 pb-1 border-t border-gray-200">
                        <div className="px-4">
                            <div className="font-medium text-base text-gray-800">{user?.name}</div>
                            <div className="font-medium text-sm text-gray-500">{user?.email}</div>
                        </div>

                        <div className="mt-3 space-y-1">
                            {/* ✅ LOGOUT ADDED HERE */}
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 focus:outline-none transition duration-150 ease-in-out"
                            >
                                Log Out
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* --- PAGE HEADER --- */}
            {header && (
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            {/* --- MAIN CONTENT --- */}
            <main>{children}</main>
        </div>
    );
}