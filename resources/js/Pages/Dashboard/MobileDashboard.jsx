import React from 'react';
import RepairerFinder from '../../Components/RepairerFinder';

// Mocks for preview (replace with real Inertia imports in your project)
const Link = ({ href, className, children }) => (
    <a href={href} className={className} onClick={(e) => e.preventDefault()}>{children}</a>
);

// Helper function to render icons (using SVGs)
const renderIcon = (type, className) => {
    switch (type) {
        case 'electrical':
            // Lightning/Energy Icon for Electrical
            return (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            );
        case 'carpentry':
            // Hammer/Tool Icon for Carpentry
            return (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        case 'seamstress':
            // Needle/Stitch Icon for Seamstress
            return (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            );
        default:
            return null;
    }
};

const MobileDashboard = ({ user, appointment, quickAccess, history, onRepairerSelect }) => {    
    // Ensure quickAccess is an array before mapping
    const quickAccessArray = Array.isArray(quickAccess) ? quickAccess : [];
    
    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-24">
            {/* Header Section: User Greeting and Notification Icon */}
            <header className="flex justify-between items-center p-6 bg-white rounded-b-3xl shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    {/* User Profile Placeholder Icon */}
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                         <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Hello,</p>
                        <h1 className="text-xl font-bold text-gray-900">{user?.name || 'Guest'}</h1>
                    </div>
                </div>
                <button className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </button>
            </header>

            <main className="px-6 mt-6 space-y-8">
                {/* Quick Access Repair Section */}
                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Access Repair</h2>
                    <div className="grid grid-cols-3 gap-4">
                        {quickAccessArray.map((item, index) => (
                            <Link 
                                href="#" 
                                key={index} 
                                className={`flex flex-col items-center justify-center p-4 rounded-3xl ${item.color} aspect-square shadow-sm transition transform active:scale-95`}
                            >
                                <div className={`mb-2 ${item.textColor}`}>
                                    {renderIcon(item.iconType, "w-8 h-8")}
                                </div>
                                <span className="text-xs font-bold text-gray-700">{item.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Upcoming Appointment Section */}
                {appointment?.exists && (
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Next appointment</h2>
                        <div className="bg-green-600 text-white rounded-3xl flex overflow-hidden shadow-lg h-24 relative">
                            <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 skew-x-12 origin-bottom-left"></div>
                            
                            {/* Date Block */}
                            <div className="bg-green-700 w-20 flex flex-col items-center justify-center shrink-0 z-10">
                                <span className="text-xl font-bold">{appointment.day}</span>
                                <span className="text-xs uppercase tracking-wider opacity-80">{appointment.month}</span>
                            </div>
                            
                            {/* Details Block */}
                            <div className="flex-1 p-4 flex flex-col justify-center z-10">
                                <p className="font-bold text-sm truncate">
                                    {appointment.time}, {appointment.repairer}
                                </p>
                                <div className="flex items-center mt-1">
                                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white">
                                        {appointment.type}
                                    </span>
                                </div>
                                <p className="text-xs opacity-70 mt-1 truncate underline decoration-green-400/50">
                                    {appointment.link}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* History / Stats Section */}
                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Activity</h2>
                    <div className="bg-blue-50 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
                        <div className="bg-white p-3 rounded-full shadow-sm text-blue-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 00-2 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-sm">{history?.lastJob}</h3>
                            <p className="text-xs text-gray-500">{history?.count} completed jobs</p>
                        </div>
                    </div>
                </div>
                <div>
                    <RepairerFinder onRepairerSelect={onRepairerSelect} />
                </div>
            </main>
        </div>
    );
};

export default MobileDashboard;