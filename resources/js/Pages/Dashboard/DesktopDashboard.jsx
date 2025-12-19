import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import ReviewModal from '../../Components/ReviewModal'; 

// --- HELPER: Render Icon based on Category ---
const renderCategoryIcon = (iconChar) => {
    return <span className="text-3xl">{iconChar}</span>;
};

const DesktopDashboard = ({ 
    user, 
    appointment, 
    categories, 
    selectedCategory, 
    onSelectCategory, 
    repairers, 
    onRepairerSelect,
    topServices, 
    
    onSwitchToWork,
    conversations = [],
    history = [], 
    pendingReviewsCount = 0
}) => {
    
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('browse');
    const [reviewingJob, setReviewingJob] = useState(null); 

    const handleLogout = () => {
        router.post('/logout');
    };

    const handleOpenChat = (bookingId) => {
        if (!bookingId) return alert("Error: Booking ID missing.");
        router.visit(`/test-chat/${bookingId}`);
    };

    // Calculate unread messages for badge
    const unreadCount = conversations.filter(c => c.unread_count > 0).length;

    // --- VIEW HELPERS ---

    // 1. Render Top Services List
    const renderTopServices = () => (
        <div className="animate-fade-in-up delay-100">
            <div className="flex justify-between items-end mb-4">
                <h2 className="text-xl font-bold text-[#5d4037] flex items-center gap-2">
                    <span className="bg-[#f2e8d9] text-[#b86c45] p-1 rounded">⭐</span> Top Services
                </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {topServices && topServices.length > 0 ? (
                    topServices.map((service, index) => (
                        <div 
                            key={index} 
                            onClick={() => onRepairerSelect(service)} 
                            className="bg-white rounded-xl shadow-sm border border-[#f2e8d9] overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
                        >
                            <div className="flex p-4 gap-4">
                                <div className="w-24 h-24 bg-[#faf9f6] rounded-lg overflow-hidden flex-shrink-0">
                                    <img src={service.image} alt={service.role} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-[#5d4037] text-lg">{service.role}</h3>
                                            <p className="text-sm text-gray-500">{service.name}</p>
                                        </div>
                                        <div className="flex items-center gap-1 bg-[#f2e8d9] px-2 py-1 rounded-lg border border-[#dcb6a2]">
                                            <span className="text-[#b86c45] text-xs">★</span>
                                            <span className="font-bold text-xs text-[#5d4037]">{service.rating}</span>
                                        </div>
                                    </div>
                                    <button className="mt-3 text-left text-xs font-bold text-[#b86c45] uppercase tracking-wide group-hover:underline">
                                        Book Now →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-2 bg-white p-8 rounded-xl border border-dashed border-[#dcb6a2] text-center text-gray-500">
                        No top services available.
                    </div>
                )}
            </div>
        </div>
    );

    // 2. Render Chat List
    const renderChatsView = () => (
        <div className="animate-fade-in-up">
            <h2 className="text-xl font-bold text-[#5d4037] mb-4 flex items-center gap-2">
                <span className="bg-[#f2e8d9] text-[#5d4037] p-1 rounded">💬</span> Your Conversations
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {conversations.length === 0 ? (
                    <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-dashed border-[#dcb6a2]">
                        <p className="text-gray-400 text-lg">No messages yet.</p>
                        <button onClick={() => setActiveTab('browse')} className="mt-4 text-[#b86c45] font-bold hover:underline">Find a Repairer to Chat</button>
                    </div>
                ) : (
                    conversations.map(chat => (
                        <div 
                            key={chat.id} 
                            onClick={() => handleOpenChat(chat.booking_id)}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-[#f2e8d9] hover:shadow-md transition-all cursor-pointer flex gap-4 items-center group"
                        >
                            <div className="relative">
                                <div className="h-14 w-14 bg-[#faf9f6] rounded-full overflow-hidden border border-[#f2e8d9] flex-shrink-0">
                                    <img src={`https://ui-avatars.com/api/?name=${chat.other_user_name}&background=random`} className="h-full w-full object-cover"/>
                                </div>
                                {chat.unread_count > 0 && <div className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></div>}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between">
                                    <h3 className="font-bold text-[#5d4037] group-hover:text-[#b86c45] transition-colors">{chat.other_user_name}</h3>
                                    <span className="text-xs text-gray-400">{chat.last_message_time}</span>
                                </div>
                                <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">Job #{chat.booking_id} • {chat.service_type}</div>
                                <p className="text-sm text-gray-600 truncate">{chat.last_message_content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    // 3. Render History View
    const renderHistoryView = () => (
        <div className="animate-fade-in-up">
            <h2 className="text-xl font-bold text-[#5d4037] mb-4 flex items-center gap-2">
                <span className="bg-[#f2e8d9] text-[#5d4037] p-1 rounded">📂</span> Job History
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
                {history.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#dcb6a2]">
                        <p className="text-gray-400 text-lg">No job history found.</p>
                        <p className="text-sm text-gray-500">Completed jobs will appear here.</p>
                    </div>
                ) : (
                    history.map((job) => (
                        <div key={job.id} className="bg-white p-6 rounded-2xl border border-[#f2e8d9] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 bg-[#f2e8d9] text-[#5d4037] rounded-xl flex items-center justify-center text-xl">✅</div>
                                <div>
                                    <h3 className="font-bold text-[#5d4037] text-lg">{job.service_type}</h3>
                                    <p className="text-sm text-gray-500">
                                        Completed by <span className="font-bold text-[#5d4037]">{job.repairer_profile?.business_name || 'Repairer'}</span>
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(job.scheduled_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="w-full md:w-auto">
                                {!job.review ? (
                                    <button 
                                        onClick={() => setReviewingJob(job)}
                                        className="w-full md:w-auto px-6 py-2 bg-[#b86c45] hover:bg-[#a65d3a] text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span>⭐</span> Leave a Review
                                    </button>
                                ) : (
                                    <div className="w-full md:w-auto px-6 py-2 bg-[#faf9f6] text-gray-400 font-bold rounded-xl border border-[#f2e8d9] text-center">
                                        You rated this {job.review.rating} ★
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    // --- MAIN RENDER ---
    return (
        <>
            <Head title="Dashboard" />

            <div className="min-h-screen bg-[#faf9f6] pb-12">
                
                {/* --- HEADER --- */}
                <div className="bg-white border-b border-[#f2e8d9] px-4 sm:px-6 lg:px-8 py-3 sticky top-0 z-50 shadow-sm">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-8">
                            {/* Logo */}
                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => {onSelectCategory(null); setActiveTab('browse');}}>
                                <h2 className="font-black text-2xl text-[#5d4037] tracking-tighter">FixMe<span className="text-[#b86c45]">.</span></h2>
                            </div>

                            {/* NAVIGATION */}
                            <nav className="hidden md:flex gap-1 bg-[#faf9f6] p-1 rounded-lg">
                                <button 
                                    onClick={() => {onSelectCategory(null); setActiveTab('browse');}}
                                    className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${
                                        activeTab === 'browse' ? 'bg-white text-[#5d4037] shadow-sm' : 'text-gray-500 hover:text-[#5d4037]'
                                    }`}
                                >
                                    Browse Services
                                </button>
                                <button 
                                    onClick={() => setActiveTab('chats')}
                                    className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${
                                        activeTab === 'chats' ? 'bg-white text-[#5d4037] shadow-sm' : 'text-gray-500 hover:text-[#5d4037]'
                                    }`}
                                >
                                    Messages
                                    {unreadCount > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                                    )}
                                </button>
                                <button 
                                    onClick={() => setActiveTab('history')}
                                    className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${
                                        activeTab === 'history' ? 'bg-white text-[#5d4037] shadow-sm' : 'text-gray-500 hover:text-[#5d4037]'
                                    }`}
                                >
                                    Job History
                                    {pendingReviewsCount > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingReviewsCount}</span>
                                    )}
                                </button>
                            </nav>
                        </div>

                        {/* USER DROPDOWN */}
                        <div className="relative">
                            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 hover:bg-[#faf9f6] px-3 py-2 rounded-full transition-colors">
                                <div className="w-8 h-8 bg-[#5d4037] rounded-full flex items-center justify-center text-white font-bold text-sm">{user.name.charAt(0)}</div>
                                <span className="font-bold text-sm text-[#5d4037] hidden md:block">{user.name}</span>
                                <svg className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#f2e8d9] z-20 overflow-hidden animate-fade-in-up">
                                        <div className="py-2">
                                            <button 
                                                onClick={() => { setIsDropdownOpen(false); onSwitchToWork(); }}
                                                className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-[#f2e8d9] hover:text-[#5d4037] flex items-center gap-3 transition-colors"
                                            >
                                                <div className="bg-[#f2e8d9] p-1.5 rounded-lg text-[#5d4037]">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                                </div>
                                                {user.isRepairer ? 'Switch to Work Mode' : 'Become a Pro'}
                                            </button>
                                            <div className="border-t border-[#f2e8d9] my-1"></div>
                                            <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 transition-colors">
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

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 mt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* LEFT COLUMN (2/3 Width) */}
                        <div className="lg:col-span-2 space-y-8">
                            
                            {/* VIEW A: BROWSE SERVICES */}
                            {activeTab === 'browse' && (
                                <>
                                    {!selectedCategory && (
                                        <div className="bg-gradient-to-br from-[#8c6745] to-[#5d4037] p-8 rounded-2xl shadow-lg text-white flex justify-between items-center animate-fade-in-up mb-8">
                                            <div>
                                                <h1 className="text-3xl font-extrabold mb-2">Hello, {user?.name.split(' ')[0]}! 👋</h1>
                                                <p className="text-[#f2e8d9] text-lg">What needs fixing today?</p>
                                            </div>
                                            <div className="text-5xl opacity-20">🛠️</div>
                                        </div>
                                    )}

                                    {!selectedCategory && (
                                        <div className="animate-fade-in-up">
                                            <h2 className="text-xl font-bold text-[#5d4037] mb-4 flex items-center gap-2">
                                                <span className="bg-[#f2e8d9] text-[#5d4037] p-1 rounded">📂</span> Categories
                                            </h2>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {categories.map((cat, index) => (
                                                    <button key={index} onClick={() => onSelectCategory(cat)} className="bg-white p-6 rounded-xl shadow-sm border border-[#f2e8d9] flex flex-col items-center gap-3 hover:shadow-md hover:border-[#dcb6a2] transition-all cursor-pointer group">
                                                        <div className={`w-16 h-16 ${cat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                            {renderCategoryIcon(cat.icon)}
                                                        </div>
                                                        <span className="font-bold text-gray-700 group-hover:text-[#b86c45]">{cat.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {!selectedCategory && renderTopServices()}

                                    {/* REPAIRER LIST */}
                                    {selectedCategory && (
                                        <div className="animate-fade-in-right">
                                            <div className="flex items-center gap-4 mb-6">
                                                <button onClick={() => onSelectCategory(null)} className="p-2 bg-white border border-gray-200 rounded-full shadow-sm text-gray-600 hover:text-black hover:bg-gray-50 transition-colors">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                                                </button>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-[#5d4037]">{selectedCategory.name} Experts</h2>
                                                    <p className="text-sm text-gray-500">Found {repairers.length} professionals</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {repairers.length === 0 ? (
                                                    <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-dashed border-[#dcb6a2]">
                                                        <div className="text-6xl mb-4">🕵️</div>
                                                        <h3 className="text-xl font-bold text-[#5d4037]">No repairers found</h3>
                                                        <button onClick={() => onSelectCategory(null)} className="mt-6 px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition">View All Categories</button>
                                                    </div>
                                                ) : (
                                                    repairers.map((repairer) => (
                                                        <div key={repairer.id} onClick={() => onRepairerSelect(repairer)} className="bg-white p-6 rounded-2xl shadow-sm border border-[#f2e8d9] hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col gap-4 group">
                                                            <div className="flex items-start gap-4">
                                                                <div className="h-16 w-16 bg-[#faf9f6] rounded-full overflow-hidden border border-[#f2e8d9] flex-shrink-0">
                                                                    <img src={`https://ui-avatars.com/api/?name=${repairer.repairer_profile.business_name}&background=random`} alt={repairer.repairer_profile.business_name} className="h-full w-full object-cover" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex justify-between items-start">
                                                                        <h3 className="font-bold text-lg text-[#5d4037] truncate">{repairer.repairer_profile.business_name}</h3>
                                                                        <span className="flex items-center text-xs font-bold bg-[#f2e8d9] text-[#5d4037] px-2 py-1 rounded-lg border border-[#dcb6a2]">★ {repairer.repairer_profile.rating || 'New'}</span>
                                                                    </div>
                                                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">📍 {repairer.location?.address || 'Davao City'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2 mt-auto">
                                                                {repairer.repairer_profile.skills?.slice(0, 3).map(skill => (
                                                                    <span key={skill.id} className="px-3 py-1 bg-[#faf9f6] text-gray-600 text-xs font-medium rounded-full border border-[#f2e8d9] group-hover:border-[#dcb6a2] group-hover:bg-[#f2e8d9] group-hover:text-[#5d4037] transition-colors">{skill.name}</span>
                                                                ))}
                                                                {repairer.repairer_profile.skills?.length > 3 && (
                                                                    <span className="px-3 py-1 text-gray-400 text-xs font-medium">+ {repairer.repairer_profile.skills.length - 3} more</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            
                            {/* VIEW B: MESSAGES */}
                            {activeTab === 'chats' && renderChatsView()}

                            {/* VIEW C: HISTORY */}
                            {activeTab === 'history' && renderHistoryView()}

                        </div>

                        {/* RIGHT COLUMN (1/3 Width) - APPOINTMENT CARD */}
                        <div className="lg:col-span-1 space-y-8">
                            
                            {/* NEXT APPOINTMENT */}
                            <div className="bg-white rounded-2xl shadow-lg border border-[#f2e8d9] overflow-hidden sticky top-24"> 
                                <div className="bg-[#5d4037] p-4 text-white text-center">
                                    <h3 className="font-bold text-lg tracking-wide uppercase">Next Job</h3>
                                </div>
                                
                                <div className="p-6">
                                    {appointment?.exists ? (
                                        <div className="text-center">
                                            <div className="inline-block bg-[#f2e8d9] text-[#5d4037] rounded-lg px-4 py-2 mb-4 border border-[#dcb6a2]">
                                                <span className="block text-3xl font-black">{appointment.day}</span>
                                                <span className="block text-sm font-bold uppercase">{appointment.month}</span>
                                            </div>
                                            
                                            <h4 className="text-xl font-bold text-[#5d4037] mb-1">{appointment.type}</h4>
                                            <p className="text-gray-500 mb-6">with {appointment.repairer}</p>
                                            
                                            <div className="flex items-center justify-center gap-2 text-gray-700 bg-[#faf9f6] py-3 rounded-lg mb-6">
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                <span className="font-mono font-bold">{appointment.time}</span>
                                            </div>

                                            {/* UPDATED BUTTON: CHAT WITH REPAIRER */}
                                            <button 
                                                onClick={() => handleOpenChat(appointment.id)}
                                                className="w-full bg-[#5d4037] text-white py-3 rounded-xl font-bold hover:bg-[#3e2b24] transition shadow-md flex items-center justify-center gap-2"
                                            >
                                                <span className="text-xl">💬</span> Chat with Repairer
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-[#5d4037] font-bold mb-1">No Upcoming Fixes</p>
                                            <p className="text-gray-500 text-sm mb-6">Your schedule is currently empty.</p>
                                            <button 
                                                onClick={() => { onSelectCategory(null); setActiveTab('browse'); }} 
                                                className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition"
                                            >
                                                Find a Service
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* HELPER BOX */}
                            <div className="bg-gradient-to-br from-[#f2e8d9] to-white p-6 rounded-2xl border border-[#dcb6a2] shadow-sm">
                                <h3 className="font-bold text-[#5d4037] mb-2">Need Help?</h3>
                                <p className="text-sm text-gray-600 mb-4">Our support team is available 24/7 to assist with your repairs.</p>
                                <a href="#" className="text-sm font-bold text-[#b86c45] hover:underline">Contact Support</a>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* REVIEW MODAL (Global) */}
            {reviewingJob && (
                <ReviewModal 
                    booking={reviewingJob} 
                    onClose={() => setReviewingJob(null)} 
                />
            )}
        </>
    );
};

export default DesktopDashboard;