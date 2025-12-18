import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import ReviewModal from '../../Components/ReviewModal';

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
    history = [], 
    conversations = [],
    pendingReviewsCount = 0, 
}) => {

    const [activeTab, setActiveTab] = useState('home');
    const [reviewingJob, setReviewingJob] = useState(null); 

    const handleLogout = () => {
        router.post('/logout');
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        onSelectCategory(null);
        setActiveTab('home'); 
    };

    const handleOpenChat = (bookingId) => {
        router.visit(`/test-chat/${bookingId}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col relative pb-24">
            
            {/* ================= HEADER SECTION ================= */}
            {activeTab === 'home' && (
                <div className="bg-gradient-to-br from-[#1b6ed1] to-[#0a4dad] pt-12 pb-10 px-6 rounded-b-[35px] shadow-lg relative overflow-hidden transition-all duration-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>

                    <div className="flex justify-between items-start text-white relative z-10">
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
                        
                        <button onClick={() => setActiveTab('profile')} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                            <img 
                                src={`https://ui-avatars.com/api/?name=${user?.name}&background=random&color=fff`} 
                                className="w-8 h-8 rounded-full border border-white/30" 
                                alt="Profile"
                            />
                        </button>
                    </div>
                </div>
            )}

            {(activeTab === 'chats' || activeTab === 'history' || activeTab === 'profile') && (
                <div className="bg-white pt-12 pb-4 px-6 shadow-sm sticky top-0 z-30">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {activeTab === 'chats' && 'Messages'}
                        {activeTab === 'history' && 'Job History'}
                        {activeTab === 'profile' && 'My Profile'}
                    </h1>
                </div>
            )}


            {/* ================= MAIN CONTENT ================= */}
            <div className={`flex-1 px-6 pb-20 relative z-20 ${activeTab === 'home' && !selectedCategory ? '-mt-6' : 'mt-4'}`}>
                
                {/* VIEW A: HOME DASHBOARD */}
                {activeTab === 'home' && (
                    <>
                        {!selectedCategory && (
                            <div className="space-y-6 animate-fade-in-up">
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

                        {selectedCategory && (
                            <div className="animate-fade-in-right space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <button onClick={() => onSelectCategory(null)} className="p-2.5 bg-white border border-gray-200 rounded-full shadow-sm text-gray-700 active:bg-gray-100">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                                    </button>
                                    <h2 className="text-xl font-black text-gray-900 drop-shadow-sm">{selectedCategory.name} Experts</h2>
                                </div>

                                {repairers.map((repairer) => (
                                    <div key={repairer.id} onClick={() => onRepairerSelect(repairer)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 active:scale-95 transition-transform">
                                        <div className="h-14 w-14 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                                            <img src={`https://ui-avatars.com/api/?name=${repairer.repairer_profile.business_name}`} className="h-full w-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-gray-900">{repairer.repairer_profile.business_name}</h3>
                                                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                                                    <span className="text-yellow-500 text-xs">★</span>
                                                    <span className="text-xs font-bold text-gray-700">
                                                        {repairer.repairer_profile.rating || 'New'}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">📍 {repairer.location?.address || 'Davao City'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* VIEW B: CHATS LIST */}
                {activeTab === 'chats' && (
                    <div className="animate-fade-in-up space-y-3">
                        {conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="bg-blue-50 p-6 rounded-full mb-4"><span className="text-4xl">💬</span></div>
                                <h3 className="font-bold text-gray-900">No messages yet</h3>
                                <p className="text-sm text-gray-500 max-w-[200px]">Book a service to start chatting.</p>
                                <button onClick={() => setActiveTab('home')} className="mt-6 px-6 py-2 bg-[#1b6ed1] text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200">Find a Repairer</button>
                            </div>
                        ) : (
                            conversations.map((chat) => (
                                <div key={chat.id} onClick={() => handleOpenChat(chat.booking_id)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 active:scale-95 transition-transform relative">
                                    {chat.unread_count > 0 && <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-red-500 rounded-full"></div>}
                                    <div className="h-14 w-14 bg-gray-100 rounded-full overflow-hidden border border-gray-100 flex-shrink-0">
                                        <img src={`https://ui-avatars.com/api/?name=${chat.other_user_name}&background=random`} className="h-full w-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="font-bold text-gray-900 truncate">{chat.other_user_name}</h3>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap">{chat.last_message_time || 'Just now'}</span>
                                        </div>
                                        <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold mb-1 border border-blue-100">
                                            Job #{chat.booking_id} • {chat.service_type || 'Repair'}
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">{chat.last_message_content || 'Chat started'}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* VIEW C: HISTORY LIST */}
                {activeTab === 'history' && (
                    <div className="animate-fade-in-up space-y-3">
                        {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="bg-gray-50 p-6 rounded-full mb-4"><span className="text-4xl">📂</span></div>
                                <h3 className="font-bold text-gray-900">No job history</h3>
                                <p className="text-sm text-gray-500 max-w-[200px]">Completed jobs will appear here.</p>
                            </div>
                        ) : (
                            history.map((job) => (
                                <div key={job.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${
                                                job.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                                            }`}>
                                                {job.status.toUpperCase()}
                                            </span>
                                            <h3 className="font-bold text-gray-900 mt-2 text-lg">{job.service_type}</h3>
                                        </div>
                                        <p className="text-xs text-gray-400 font-bold uppercase">
                                            {new Date(job.scheduled_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-4">{job.problem_description}</p>
                                    
                                    {job.status === 'completed' && (
                                        <>
                                            {!job.review ? (
                                                <button 
                                                    onClick={() => setReviewingJob(job)}
                                                    className="w-full py-2 bg-yellow-400 text-black font-bold rounded-xl text-sm shadow-sm active:scale-95 transition-transform"
                                                >
                                                    ⭐ Leave a Review
                                                </button>
                                            ) : (
                                                <div className="w-full py-2 bg-gray-50 text-gray-400 font-bold rounded-xl text-sm text-center border border-gray-100">
                                                    You rated this {job.review.rating} ★
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* VIEW D: PROFILE TAB */}
                {activeTab === 'profile' && (
                    <div className="animate-fade-in-up space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
                                <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=random&color=fff&size=128`} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900">{user?.name}</h2>
                                <p className="text-sm text-gray-500">{user?.email}</p>
                            </div>
                        </div>

                        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 space-y-1">
                            <button onClick={onSwitchToWork} className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 rounded-xl transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg">⚡</div>
                                    <span className="font-bold text-gray-700">Switch to Repairer Mode</span>
                                </div>
                                <span className="text-gray-300 group-hover:text-blue-600">→</span>
                            </button>
                            <div className="h-px bg-gray-50 mx-4"></div>
                            <button onClick={handleLogout} className="w-full flex items-center justify-between px-4 py-4 hover:bg-red-50 rounded-xl transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-lg">🚪</div>
                                    <span className="font-bold text-gray-700 group-hover:text-red-600">Log Out</span>
                                </div>
                                <span className="text-gray-300 group-hover:text-red-600">→</span>
                            </button>
                        </div>
                        <div className="text-center text-[10px] text-gray-300 font-bold pt-4">FixMe Customer App v1.0</div>
                    </div>
                )}

            </div>

            {/* ================= BOTTOM NAVIGATION ================= */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-6 flex justify-between items-center z-50 pb-safe">
                <NavButton 
                    label="Home" 
                    icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />} 
                    isActive={activeTab === 'home'} 
                    onClick={() => { scrollToTop(); setActiveTab('home'); }} 
                />
                <NavButton 
                    label="Chats" 
                    icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />} 
                    isActive={activeTab === 'chats'} 
                    onClick={() => setActiveTab('chats')}
                    badge={conversations.some(c => c.unread_count > 0)} 
                />
                <NavButton 
                    label="History" 
                    icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />} 
                    isActive={activeTab === 'history'} 
                    onClick={() => setActiveTab('history')} 
                    badge={pendingReviewsCount > 0} 
                    badgeCount={pendingReviewsCount} 
                />
                <NavButton 
                    label="Profile" 
                    icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />} 
                    isActive={activeTab === 'profile'} 
                    onClick={() => setActiveTab('profile')} 
                />
            </div>

            {reviewingJob && (
                <ReviewModal 
                    booking={reviewingJob} 
                    onClose={() => setReviewingJob(null)} 
                />
            )}

        </div>
    );
};

const NavButton = ({ label, icon, isActive, onClick, badge, badgeCount, customColor }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center gap-1 transition-colors relative ${
            customColor ? customColor : (isActive ? 'text-[#1b6ed1]' : 'text-gray-400 hover:text-gray-600')
        }`}
    >
        <div className="relative">
            <svg className="w-6 h-6" fill={isActive ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                {icon}
            </svg>
            {badge && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                    {badgeCount > 0 && (
                        <span className="text-[9px] text-white font-bold leading-none px-0.5">
                            {badgeCount}
                        </span>
                    )}
                </span>
            )}
        </div>
        <span className="text-[10px] font-medium">{label}</span>
    </button>
);

export default MobileDashboard;