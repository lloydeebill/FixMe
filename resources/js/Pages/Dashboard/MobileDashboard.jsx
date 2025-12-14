import React, { useState } from 'react';
import { router } from '@inertiajs/react';

const MobileDashboard = ({ 
    user, 
    appointment, 
    categories,       
    selectedCategory, 
    onSelectCategory, 
    repairers,        
    onRepairerSelect, 
    topServices,      
    onSwitchToWork,
    
    // 👇 NEW PROP: Pass your active conversations here from the Parent
    conversations = [] 
}) => {

    // 1. STATE: Track which tab is open ('home' or 'chats')
    const [activeTab, setActiveTab] = useState('home');

    const handleLogout = () => {
        router.post('/logout');
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        onSelectCategory(null);
        setActiveTab('home'); // Reset to home
    };

    // 2. HANDLER: Go to the actual chat room
    const handleOpenChat = (bookingId) => {
        // Option A: If TestChat is a separate page
        router.visit(`/test-chat/${bookingId}`);
        
        // Option B: If you want to open it as a modal (Advanced)
        // onOpenChat(bookingId); 
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col relative pb-24">
            
            {/* ==============================================
                1. HEADER (Only show on HOME tab)
               ============================================== */}
            {activeTab === 'home' && (
                <div className="bg-gradient-to-br from-[#1b6ed1] to-[#0a4dad] pt-12 pb-10 px-6 rounded-b-[35px] shadow-lg relative overflow-hidden transition-all duration-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>

                    <div className="flex justify-between items-start mb-6 text-white relative z-10">
                        {appointment?.exists ? (
                            <div className="flex items-center gap-3 animate-fade-in-right">
                                <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                                    <span className="text-2xl">📅</span>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-blue-200 font-semibold">Upcoming Job</p>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-lg leading-tight text-white">{appointment.type}</span>
                                        <span className="text-xs text-blue-100">{appointment.day} {appointment.month} • {appointment.time}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 animate-fade-in-right">
                                <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                                    <span className="text-2xl">👋</span>
                                </div>
                                <div>
                                    <p className="text-xs text-blue-100 opacity-90">Good Morning,</p>
                                    <h1 className="font-bold text-2xl leading-none">{user?.name?.split(' ')[0] || 'Guest'}</h1>
                                </div>
                            </div>
                        )}
                        
                        <button onClick={handleLogout} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    </div>

                    <div className="relative z-10">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input type="text" placeholder="What needs fixing today?" className="w-full py-4 pl-12 pr-4 bg-white text-gray-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 shadow-xl placeholder-gray-400 text-sm font-medium transition-shadow" />
                    </div>
                </div>
            )}

            {/* ==============================================
                2. HEADER (CHATS TAB ONLY)
               ============================================== */}
            {activeTab === 'chats' && (
                <div className="bg-white pt-12 pb-4 px-6 shadow-sm sticky top-0 z-30">
                    <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                    <p className="text-xs text-gray-500">Your conversations with repairers</p>
                </div>
            )}


            {/* ==============================================
                3. MAIN CONTENT AREA
               ============================================== */}
            <div className={`flex-1 px-6 pb-20 relative z-20 ${activeTab === 'home' ? '-mt-4' : 'mt-4'}`}>
                
                {/* -------------------------
                    VIEW A: HOME DASHBOARD
                   ------------------------- */}
                {activeTab === 'home' && (
                    <>
                        {!selectedCategory && (
                            <div className="space-y-6 animate-fade-in-up">
                                {/* Categories Grid */}
                                <div className="bg-white p-5 rounded-[25px] shadow-md border border-gray-100">
                                    <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                                        {categories.map((cat, index) => (
                                            <button key={index} onClick={() => onSelectCategory(cat)} className="flex flex-col items-center gap-2 group">
                                                <div className={`w-12 h-12 ${cat.color} rounded-2xl flex items-center justify-center text-xl transition-transform group-hover:scale-110 shadow-sm border border-black/5`}>
                                                    {cat.icon}
                                                </div>
                                                <span className="text-[10px] font-medium text-gray-600 text-center leading-tight">{cat.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Top Services (Horizontal Scroll) */}
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800 mb-3 px-1">Top Rated Near You</h2>
                                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
                                        {topServices?.map((service, index) => (
                                            <div key={index} onClick={() => onRepairerSelect(service)} className="min-w-[140px] bg-white p-2 rounded-2xl shadow-sm border border-gray-100 snap-center active:scale-95 transition-transform">
                                                <div className="h-24 w-full rounded-xl overflow-hidden bg-gray-100 relative mb-2">
                                                    <img src={`https://ui-avatars.com/api/?name=${service.role}&background=random`} className="w-full h-full object-cover" />
                                                    <div className="absolute top-2 right-2 bg-white/90 px-1.5 rounded-md text-[10px] font-bold shadow-sm">★ {service.rating}</div>
                                                </div>
                                                <h3 className="font-bold text-xs text-gray-900 truncate px-1">{service.role}</h3>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Repairer List (When Category Selected) */}
                        {selectedCategory && (
                            <div className="animate-fade-in-right space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <button onClick={() => onSelectCategory(null)} className="p-2 bg-white border border-gray-200 rounded-full shadow-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg></button>
                                    <h2 className="text-xl font-bold text-gray-900">{selectedCategory.name} Experts</h2>
                                </div>
                                {repairers.map((repairer) => (
                                    <div key={repairer.id} onClick={() => onRepairerSelect(repairer)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 active:scale-95 transition-transform">
                                        <div className="h-14 w-14 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                                            <img src={`https://ui-avatars.com/api/?name=${repairer.repairer_profile.business_name}`} className="h-full w-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900">{repairer.repairer_profile.business_name}</h3>
                                            <p className="text-xs text-gray-500">📍 {repairer.location?.address || 'Davao City'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* -------------------------
                    VIEW B: CHATS LIST (NEW!)
                   ------------------------- */}
                {activeTab === 'chats' && (
                    <div className="animate-fade-in-up space-y-3">
                        {conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="bg-blue-50 p-6 rounded-full mb-4">
                                    <span className="text-4xl">💬</span>
                                </div>
                                <h3 className="font-bold text-gray-900">No messages yet</h3>
                                <p className="text-sm text-gray-500 max-w-[200px]">Book a service to start chatting with a repairer.</p>
                                <button onClick={() => setActiveTab('home')} className="mt-6 px-6 py-2 bg-[#1b6ed1] text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200">
                                    Find a Repairer
                                </button>
                            </div>
                        ) : (
                            conversations.map((chat) => (
                                <div 
                                    key={chat.id} 
                                    onClick={() => handleOpenChat(chat.booking_id)}
                                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 active:scale-95 transition-transform relative"
                                >
                                    {/* Unread Dot (Optional Logic) */}
                                    {chat.unread_count > 0 && (
                                        <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                                    )}

                                    {/* Avatar */}
                                    <div className="h-14 w-14 bg-gray-100 rounded-full overflow-hidden border border-gray-100 flex-shrink-0">
                                        <img 
                                            src={`https://ui-avatars.com/api/?name=${chat.other_user_name}&background=random`} 
                                            alt="User" 
                                            className="h-full w-full object-cover"
                                        />
                                    </div>

                                    {/* Chat Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="font-bold text-gray-900 truncate">{chat.other_user_name}</h3>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap">{chat.last_message_time || 'Just now'}</span>
                                        </div>
                                        
                                        {/* Context Badge (Booking Info) */}
                                        <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold mb-1 border border-blue-100">
                                            Job #{chat.booking_id} • {chat.service_type || 'Repair'}
                                        </div>

                                        <p className="text-sm text-gray-500 truncate">
                                            {chat.last_message_content || 'Click to view conversation...'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* ==============================================
                4. BOTTOM NAVIGATION (UPDATED!)
               ============================================== */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-6 flex justify-between items-center z-50 pb-safe">
                
                {/* 1. HOME */}
                <button 
                    onClick={() => {
                        scrollToTop();
                        setActiveTab('home');
                    }}
                    className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-[#1b6ed1]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <svg className="w-6 h-6" fill={activeTab === 'home' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    <span className="text-[10px] font-medium">Home</span>
                </button>

                {/* 2. CHATS (NEW!) */}
                <button 
                    onClick={() => setActiveTab('chats')}
                    className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'chats' ? 'text-[#1b6ed1]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <div className="relative">
                        <svg className="w-6 h-6" fill={activeTab === 'chats' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {/* Notification Dot (Optional) */}
                        {conversations.some(c => c.unread_count > 0) && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </div>
                    <span className="text-[10px] font-medium">Chats</span>
                </button>

                {/* 3. SWITCH MODE */}
                <button 
                    onClick={onSwitchToWork}
                    className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#1b6ed1] transition-colors"
                >
                    <div className="bg-blue-50 p-1 rounded-lg">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    </div>
                    <span className="text-[10px] font-medium">Switch</span>
                </button>

                {/* 4. LOGOUT */}
                <button 
                    onClick={handleLogout}
                    className="flex flex-col items-center gap-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    <span className="text-[10px] font-medium">Logout</span>
                </button>

            </div>
        </div>
    );
};

export default MobileDashboard;