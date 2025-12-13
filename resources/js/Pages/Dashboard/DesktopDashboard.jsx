import React, { useState } from 'react'; // 1. Added useState
import { Head, router } from '@inertiajs/react'; // 2. Added router

// --- HELPER: Category Icons (Kept same) ---
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

const DesktopDashboard = ({ user, appointment, history, onRepairerSelect, topServices, onSwitchToWork }) => {
    
    // 3. ADDED STATE FOR DROPDOWN
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const categories = [
        { name: 'Repairer', type: 'repairer' },
        { name: 'Cleaning', type: 'cleaning' },
        { name: 'Plumbing', type: 'plumbing' },
        { name: 'Electrical', type: 'electrical' },
    ];

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <>
            <Head title="Dashboard" />

            <div className="min-h-screen bg-gray-50 pb-12">
                
                {/* --- CUSTOM HEADER --- */}
                <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 mb-8 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        
                        {/* 1. RENAMED TO FixMe */}
                        <div className="flex items-center gap-4">
                            <h2 className="font-black text-2xl text-blue-600 tracking-tighter">FixMe.</h2>
                        </div>

                        {/* 2. USER DROPDOWN MENU */}
                        <div className="relative">
                            <button 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full transition-colors"
                            >
                                <span className="font-bold text-sm text-gray-700">{user.name}</span>
                                <svg className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Content */}
                            {isDropdownOpen && (
                                <>
                                    {/* Invisible Overlay to close menu when clicking outside */}
                                    <div 
                                        className="fixed inset-0 z-10" 
                                        onClick={() => setIsDropdownOpen(false)}
                                    ></div>

                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden animate-fade-in-up">
                                        <div className="py-2">
                                            {/* OPTION A: SWITCH / BECOME PRO */}
                                            <button 
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    onSwitchToWork();
                                                }}
                                                className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 flex items-center gap-3 transition-colors"
                                            >
                                                <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                                </div>
                                                {user.isRepairer ? 'Switch to Work Mode' : 'Become a Pro'}
                                            </button>

                                            <div className="border-t border-gray-100 my-1"></div>

                                            {/* OPTION B: LOGOUT */}
                                            <button 
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 transition-colors"
                                            >
                                                <div className="bg-gray-100 p-1.5 rounded-lg text-gray-500 group-hover:text-red-600">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                                </div>
                                                Log Out
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                    
                    {/* --- 1. WELCOME BANNER --- */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border-l-8 border-[#1b6ed1] flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                                Hello, {user?.name || 'FixMe User'}! 👋
                            </h1>
                            <p className="text-gray-500 text-lg">
                                Ready to get things fixed? Select a service below.
                            </p>
                            
                            <button 
                                onClick={onSwitchToWork}
                                className="mt-3 text-[#1b6ed1] font-bold text-sm hover:underline flex items-center gap-1"
                            >
                                {user.isRepairer ? 'Go to your Repairer Dashboard →' : 'Want to earn money? Register as a Repairer →'}
                            </button>
                        </div>
                        <div className="hidden lg:block">
                             {/* Optional: Add a Dashboard Illustration/Icon here if desired */}
                        </div>
                    </div>

                    {/* --- 2. MAIN GRID LAYOUT --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* LEFT COLUMN (2/3 Width) - FINDER & ACTIVITY */}
                        <div className="lg:col-span-2 space-y-8">
                            
                            {/* SECTION A: BROWSE CATEGORIES */}
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-600 p-1 rounded">📂</span> Categories
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {categories.map((cat, index) => (
                                        <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
                                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-[#1b6ed1] group-hover:text-white transition-colors">
                                                <div className="group-hover:text-white text-[#1b6ed1]">
                                                    {renderCategoryIcon(cat.type)}
                                                </div>
                                            </div>
                                            <span className="font-bold text-gray-700 group-hover:text-[#1b6ed1]">{cat.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SECTION B: TOP SERVICES (THE REPAIRER LIST) */}
                            <div>
                                <div className="flex justify-between items-end mb-4">
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <span className="bg-yellow-100 text-yellow-600 p-1 rounded">⭐</span> Top Services
                                    </h2>
                                    <a href="#" className="text-sm font-semibold text-[#1b6ed1] hover:underline">View All</a>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {topServices && topServices.length > 0 ? (
                                        topServices.map((service, index) => (
                                            <div 
                                                key={index} 
                                                onClick={() => onRepairerSelect(service)} 
                                                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
                                            >
                                                <div className="flex p-4 gap-4">
                                                    {/* Image */}
                                                    <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                                        <img src={service.image} alt={service.role} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    </div>
                                                    
                                                    {/* Info */}
                                                    <div className="flex-1 flex flex-col justify-center">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h3 className="font-bold text-gray-900 text-lg">{service.role}</h3>
                                                                <p className="text-sm text-gray-500">{service.name}</p>
                                                            </div>
                                                            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                                                                <span className="text-yellow-500 text-xs">★</span>
                                                                <span className="font-bold text-xs text-gray-700">{service.rating}</span>
                                                            </div>
                                                        </div>
                                                        <button className="mt-3 text-left text-xs font-bold text-[#1b6ed1] uppercase tracking-wide group-hover:underline">
                                                            Book Now →
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-2 bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
                                            No repairers available right now. Be the first to join!
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            
                        </div>

                        {/* RIGHT COLUMN (1/3 Width) - APPOINTMENT CARD */}
                        <div className="lg:col-span-1 space-y-8">
                            
                            {/* UPCOMING APPOINTMENT (Using Real Logic) */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24"> 
                                <div className="bg-[#1b6ed1] p-4 text-white text-center">
                                    <h3 className="font-bold text-lg tracking-wide uppercase">Next Appointment</h3>
                                </div>
                                
                                <div className="p-6">
                                    {appointment?.exists ? (
                                        <div className="text-center">
                                            <div className="inline-block bg-blue-50 text-blue-800 rounded-lg px-4 py-2 mb-4 border border-blue-100">
                                                <span className="block text-3xl font-black">{appointment.day}</span>
                                                <span className="block text-sm font-bold uppercase">{appointment.month}</span>
                                            </div>
                                            
                                            <h4 className="text-xl font-bold text-gray-900 mb-1">{appointment.type}</h4>
                                            <p className="text-gray-500 mb-6">with {appointment.repairer}</p>
                                            
                                            <div className="flex items-center justify-center gap-2 text-gray-700 bg-gray-50 py-3 rounded-lg mb-6">
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                <span className="font-mono font-bold">{appointment.time}</span>
                                            </div>

                                            <button className="w-full bg-[#1b6ed1] text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-md">
                                                View Details
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                            <p className="text-gray-900 font-bold mb-1">No Upcoming Fixes</p>
                                            <p className="text-gray-500 text-sm mb-6">Your schedule is currently empty.</p>
                                            <button className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition">
                                                Book a Service
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* HELPER BOX */}
                            <div className="bg-gradient-to-br from-yellow-50 to-white p-6 rounded-2xl border border-yellow-100 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-2">Need Help?</h3>
                                <p className="text-sm text-gray-600 mb-4">Our support team is available 24/7 to assist with your repairs.</p>
                                <a href="#" className="text-sm font-bold text-[#1b6ed1] hover:underline">Contact Support</a>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DesktopDashboard;