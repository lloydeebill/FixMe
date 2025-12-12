import React from 'react';
import { Link, router } from '@inertiajs/react';

// Helper for Category Icons
const renderCategoryIcon = (type) => {
    const iconClass = "w-8 h-8 text-[#1b6ed1]";
    switch (type) {
        case 'repairer':
            return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
        case 'cleaning':
            return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
        case 'plumbing':
            return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
        case 'electrical':
            return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
        default:
            return <div className="w-8 h-8 bg-gray-200 rounded-full"></div>;
    }
};

const MobileDashboard = ({ user, appointment, onRepairerSelect, topServices, onSwitchToWork }) => {
    
    const categories = [
        { name: 'Repairer', type: 'repairer' },
        { name: 'Cleaning', type: 'cleaning' },
        { name: 'Plumbing', type: 'plumbing' },
        { name: 'Electrical', type: 'electrical' },
    ];

    const handleLogout = () => {
        router.post('/logout');
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col relative pb-20">
            
            {/* 1. TOP HEADER SECTION (YOUR PREFERRED DESIGN) */}
            <div className="bg-[#1b6ed1] pt-12 pb-8 px-6 rounded-b-[30px] shadow-sm transition-all duration-300">
                <div className="flex justify-between items-start mb-6 text-white">
                    {appointment?.exists ? (
                        <div className="flex items-center gap-3 animate-fade-in-right">
                            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                <svg className="w-6 h-6 text-[#ffde59]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-blue-100 opacity-90">{appointment.type} by {appointment.repairer}</p>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-base leading-tight">{appointment.time}, {appointment.day} {appointment.month}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 animate-fade-in-right">
                            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-blue-100 opacity-90">Hello, {user?.name || 'Guest'}</p>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-lg leading-tight">You need fixing?</span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Visual Button (Doesn't do much, just for look) */}
                    <button className="relative p-2">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        <span className="absolute top-1 right-2 w-2 h-2 bg-[#ffde59] rounded-full border border-[#1b6ed1]"></span>
                    </button>
                </div>

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input type="text" placeholder="Search service..." className="w-full py-3.5 pl-12 pr-10 bg-white text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffde59] shadow-sm placeholder-gray-400 text-sm" />
                </div>
            </div>

            {/* 2. MAIN CONTENT AREA */}
            <div className="flex-1 px-6 pt-6 pb-20 overflow-y-auto">
                
                {/* 🛑 REMOVED: Redundant Appointment Card in Body */}

                {/* Categories */}
                <div className="mb-8">
                    <div className="flex justify-between items-end mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Browse by Categories</h2>
                        <a href="#" className="text-xs font-semibold text-[#1b6ed1]">See All</a>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        {categories.map((cat, index) => (
                            <div key={index} className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center hover:bg-blue-100 transition-colors shadow-sm text-[#1b6ed1]">
                                    {renderCategoryIcon(cat.type)}
                                </div>
                                <span className="text-xs font-medium text-gray-600">{cat.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Services */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Top services</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {topServices && topServices.length > 0 ? (
                            topServices.map((service, index) => (
                                <div key={index} onClick={() => onRepairerSelect(service)} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 hover:shadow-md transition-shadow cursor-pointer">
                                    <div className="h-28 w-full rounded-xl overflow-hidden bg-gray-100">
                                        <img src={service.image} alt={service.role} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-gray-900 truncate">{service.role}</h3>
                                        <div className="flex items-center text-xs font-bold bg-yellow-50 text-gray-700 px-1.5 py-0.5 rounded border border-yellow-100 w-fit mt-1">
                                            <span className="text-[#ffde59] mr-0.5">★</span> {service.rating}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 text-center text-gray-500 text-sm py-4">
                                No repairers available.
                            </div>
                        )}
                    </div>
                </div>
            </div>

           {/* 3. SIMPLIFIED FLAT NAV (Home, Switch, Logout) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-8 flex justify-between items-center z-50">
                
                {/* 1. HOME */}
                <button 
                    onClick={scrollToTop}
                    className="flex flex-col items-center gap-1 text-[#1b6ed1] cursor-pointer"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    <span className="text-[10px] font-medium">Home</span>
                </button>

                {/* 2. SWITCH - FIXED ALIGNMENT */}
                <button 
                    onClick={onSwitchToWork}
                    className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#1b6ed1] cursor-pointer transition-colors"
                >
                    {/* 🛑 FIX: 
                        1. Removed '-mt-2' (Stop pulling it up) 
                        2. Removed 'mb-1' (Stop pushing text down)
                        3. Kept 'bg-blue-50' so it still highlights, but sits flat.
                    */}
                    <div className="bg-blue-50 p-1.5 rounded-full">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    </div>
                    <span className="text-[10px] font-medium">Switch</span>
                </button>

                {/* 3. LOGOUT */}
                <button 
                    onClick={handleLogout}
                    className="flex flex-col items-center gap-1 text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    <span className="text-[10px] font-medium">Logout</span>
                </button>

            </div>
        </div>
    );
};

export default MobileDashboard;