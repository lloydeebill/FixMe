import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import ReviewModal from '../../Components/ReviewModal';

/* ─────────────────────────────────────────────────────────────
   LIQUID GLASS — FixMe. Mobile Dashboard (warm earth-tone palette)
   visionOS / macOS Sonoma aesthetic adapted for responsive mobile
───────────────────────────────────────────────────────────── */

const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        :root {
            --coffee:      #3b2314;
            --espresso:    #5d3a1a;
            --mocha:       #7c5230;
            --caramel:     #b07d4a;
            --latte:       #c8a97a;
            --cream:       #f5ede0;
            --parchment:   #faf6f0;
            --white:       #ffffff;

            /* Glass surfaces */
            --glass-bg:          rgba(255,248,238,0.60);
            --glass-bg-dark:     rgba(59,35,20,0.82);
            --glass-border:      rgba(255,255,255,0.65);
            --glass-shadow:      0 8px 32px rgba(59,35,20,0.08), 0 2px 8px rgba(59,35,20,0.04);
            --glass-shadow-lg:   0 16px 40px rgba(59,35,20,0.15), 0 4px 12px rgba(59,35,20,0.08);

            --blur-sm: blur(12px);
            --blur-md: blur(24px);
            --blur-lg: blur(40px);
        }

        body {
            font-family: 'Sora', sans-serif;
            background: var(--parchment);
            margin: 0; padding: 0;
        }

        /* Ambient background */
        .fixme-bg {
            position: fixed; inset: 0; z-index: 0;
            background:
                radial-gradient(ellipse 90% 40% at 20% 5%,   rgba(180,120,60,0.18) 0%, transparent 50%),
                radial-gradient(ellipse 70% 50% at 80% 90%,   rgba(92,50,20,0.12)  0%, transparent 50%),
                radial-gradient(ellipse 60% 40% at 50% 40%,   rgba(200,169,122,0.08) 0%, transparent 50%),
                linear-gradient(160deg, #faf6f0 0%, #f3e8d4 60%, #ebdcb9 100%);
            overflow: hidden;
        }
        .fixme-bg::before {
            content: '';
            position: absolute; inset: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
            opacity: 0.6;
        }

        /* Glass surfaces */
        .glass {
            background: var(--glass-bg);
            backdrop-filter: var(--blur-sm);
            -webkit-backdrop-filter: var(--blur-sm);
            border: 1px solid var(--glass-border);
            box-shadow: var(--glass-shadow);
        }
        .glass-dark {
            background: var(--glass-bg-dark);
            backdrop-filter: var(--blur-md);
            -webkit-backdrop-filter: var(--blur-md);
            border: 1px solid rgba(255,255,255,0.15);
            box-shadow: var(--glass-shadow-lg);
        }
        
        .glass-edge {
            position: relative;
            overflow: hidden;
        }
        .glass-edge::after {
            content: '';
            position: absolute; inset: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.30) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.08) 100%);
            pointer-events: none; border-radius: inherit;
        }

        /* Hero / Header layout elements */
        .hero-mobile {
            border-radius: 0 0 32px 32px;
            padding: 30px 24px 20px; 
            color: white;
            position: relative;
            overflow: hidden;
        }
        .hero-mobile::before {
            content: '';
            position: absolute; top: -40px; right: -40px;
            width: 180px; height: 180px;
            background: radial-gradient(circle, rgba(200,169,122,0.25) 0%, transparent 70%);
            pointer-events: none;
        }

        /* Inline Components */
        .logo-text {
            font-family: 'DM Serif Display', serif;
            font-size: 22px;
            color: var(--espresso);
            letter-spacing: -0.3px;
        }
        .logo-dot { color: var(--caramel); }

        .section-title {
            font-size: 14px; font-weight: 700;
            color: var(--espresso);
            display: flex; align-items: center; gap: 8px;
            letter-spacing: -0.2px;
        }
        .section-badge {
            width: 26px; height: 26px; border-radius: 8px;
            background: rgba(176,125,74,0.12);
            display: flex; align-items: center; justify-content: center;
            font-size: 12px;
        }

        /* ✨ AI SMART UTILITY HUB GRID */
        .ai-grid-btn {
            background: rgba(255, 252, 245, 0.65);
            backdrop-filter: var(--blur-sm);
            -webkit-backdrop-filter: var(--blur-sm);
            border: 1px solid rgba(176, 125, 74, 0.35);
            border-radius: 20px;
            padding: 16px 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 14px rgba(59,35,20,0.05), inset 0 1px 0 rgba(255,255,255,0.6);
            transition: transform 0.2s cubic-bezier(.25,1,.32,1), background-color 0.2s ease, box-shadow 0.2s ease;
        }
        .ai-grid-btn::after {
            content: '';
            position: absolute; inset: 0;
            background: linear-gradient(135deg, rgba(200,169,122,0.15) 0%, transparent 60%);
            pointer-events: none;
        }
        .ai-grid-btn:active {
            transform: scale(0.95);
            background: rgba(255, 248, 238, 0.90);
            box-shadow: 0 2px 6px rgba(59,35,20,0.03);
        }
        .ai-icon-circle {
            width: 44px; height: 44px;
            border-radius: 14px;
            display: flex; align-items: center; justify-content: center;
            font-size: 20px;
            background: linear-gradient(135deg, rgba(245,237,224,0.90) 0%, rgba(210,180,140,0.40) 100%);
            border: 1px solid rgba(255,255,255,0.80);
            box-shadow: 0 2px 8px rgba(176,125,74,0.10);
        }

        /* 📂 BEAUTIFIED 2x2 CATEGORY TILES */
        .cat-tile {
            border-radius: 18px;                       
            padding: 14px 10px;                     
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            gap: 8px; 
            background: rgba(255,255,255,0.45);
            border: 1px solid rgba(255,255,255,0.7);
            box-shadow: 0 4px 12px rgba(59,35,20,0.04); 
            transition: transform 0.2s cubic-bezier(.25,1,.32,1), background-color 0.2s ease;
        }
        .cat-tile:active {
            transform: scale(0.96);
            background: rgba(255,255,255,0.8);
        }
        .cat-icon-wrap {
            width: 38px; height: 38px;                
            border-radius: 12px;                       
            display: flex; align-items: center; justify-content: center;
            font-size: 18px;                          
            position: relative;
            box-shadow: 0 2px 6px rgba(59,35,20,0.04);
        }
        .cat-icon-wrap::after {
            content: ''; position: absolute; inset: 0; border-radius: inherit;
            background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%);
        }

        .star-badge {
            display: flex; align-items: center; gap: 3px;
            background: rgba(245,237,224,0.85);
            border: 1px solid rgba(176,125,74,0.25);
            border-radius: 8px; padding: 3px 8px;
            font-size: 11px; font-weight: 700; color: var(--espresso);
        }

        .btn-dark {
            background: linear-gradient(135deg, var(--coffee) 0%, var(--espresso) 100%);
            color: white; border: none; border-radius: 16px;
            font-weight: 700; font-size: 13px;
            padding: 12px 24px; width: 100%; transition: opacity 0.2s;
            box-shadow: 0 4px 14px rgba(59,35,20,0.25);
        }
        .btn-dark:active { opacity: 0.85; }

        .btn-caramel {
            background: linear-gradient(135deg, var(--caramel) 0%, var(--mocha) 100%);
            color: white; border: none; border-radius: 14px;
            font-weight: 700; font-size: 12px; padding: 10px 20px;
            box-shadow: 0 4px 12px rgba(124,82,48,0.2);
        }
        .btn-caramel:active { opacity: 0.85; }

        .skill-chip {
            background: rgba(255,248,238,0.75);
            border: 1px solid rgba(176,125,74,0.2);
            border-radius: 8px; padding: 3px 10px;
            font-size: 10px; font-weight: 600; color: var(--mocha);
        }

        .list-row {
            display: flex; align-items: center; gap: 14px;
            padding: 14px 16px; border-radius: 20px;
            background: rgba(255,248,238,0.6);
            border: 1px solid rgba(255,255,255,0.7);
            box-shadow: 0 2px 8px rgba(59,35,20,0.03);
            transition: transform 0.2s ease;
        }
        .list-row:active { transform: scale(0.98); }

        .empty-state {
            text-align: center; padding: 48px 20px; border-radius: 20px;
            background: rgba(255,248,238,0.4);
            border: 1.5px dashed rgba(176,125,74,0.25);
        }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* Animations */
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(.25,1,.32,1) both; }
    `}</style>
);

const CAT_COLORS = [
    { bg: 'rgba(176,125,74,0.15)',  emoji: '🔧' },
    { bg: 'rgba(100,160,120,0.15)', emoji: '⚡' },
    { bg: 'rgba(180,140,80,0.15)',  emoji: '🪚' },
    { bg: 'rgba(150,110,180,0.15)', emoji: '🔌' },
    { bg: 'rgba(80,160,200,0.15)',  emoji: '❄️' },
    { bg: 'rgba(200,120,80,0.15)',  emoji: '🧱' },
    { bg: 'rgba(100,180,160,0.15)', emoji: '🎨' },
    { bg: 'rgba(200,170,100,0.15)', emoji: '🧹' },
];

const MobileDashboard = ({ 
    user, 
    appointment, 
    categories = [],       
    selectedCategory, 
    onSelectCategory, 
    repairers = [],        
    onRepairerSelect, 
    topServices = [],      
    onSwitchToWork,
    history = [], 
    conversations = [],
    pendingReviewsCount = 0, 
}) => {
    const [activeTab, setActiveTab] = useState('home');
    const [reviewingJob, setReviewingJob] = useState(null); 

    const handleLogout = () => router.post('/logout');
    const handleOpenChat = (bookingId) => router.visit(`/test-chat/${bookingId}`);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        onSelectCategory(null);
        setActiveTab('home'); 
    };

    const getCatStyle = (index) => CAT_COLORS[index % CAT_COLORS.length];

    return (
        <>
            <GlobalStyles />
            <Head title="Dashboard — FixMe." />

            {/* Ambient liquid background layer */}
            <div className="fixme-bg" />

            <div className="min-h-screen flex flex-col relative pb-28 z-10">
                
                {/* ================= HEADER SECTION ================= */}
                {activeTab === 'home' && (
                    <div className="hero-mobile glass-dark glass-edge shadow-xl">
                        <div className="flex justify-between items-center relative z-10">
                            {appointment?.exists ? (
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/15 p-2.5 rounded-xl border border-white/15 backdrop-blur-md shadow-inner">
                                        <span className="text-xl">🗓️</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-white/60 font-semibold mb-0.5">Upcoming Focus</p>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-base leading-tight text-white">{appointment.type}</span>
                                            <span className="text-xs text-[#c8a97a] font-medium mt-0.5">{appointment.day} {appointment.month} • {appointment.time}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/15 p-2.5 rounded-xl border border-white/15 backdrop-blur-md shadow-inner">
                                        <span className="text-xl">👋</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/60 font-medium">Good Morning,</p>
                                        <h1 className="font-bold text-xl leading-tight text-white mt-0.5">
                                            {user?.name?.split(' ')[0] || 'Guest'}
                                        </h1>
                                    </div>
                                </div>
                            )}
                            
                            <button onClick={() => setActiveTab('profile')} className="relative p-0.5 rounded-full bg-white/10 border border-white/20 shadow-md">
                                <img 
                                    src={`https://ui-avatars.com/api/?name=${user?.name || 'Guest'}&background=c8a97a&color=3b2314&bold=true`} 
                                    className="w-9 h-9 rounded-full object-cover" 
                                    alt="Profile"
                                />
                            </button>
                        </div>
                    </div>
                )}

                {/* Sub-view Sticky Headers */}
                {(activeTab === 'chats' || activeTab === 'history' || activeTab === 'profile') && (
                    <div className="bg-[#faf6f0]/80 backdrop-blur-xl pt-2 pb-4 px-6 border-b border-white/50 sticky top-0 z-30 flex justify-between items-center">
                        <div className="logo-text">
                            {activeTab === 'chats' && 'Messages'}
                            {activeTab === 'history' && 'Job History'}
                            {activeTab === 'profile' && 'My Profile'}
                            <span className="logo-dot">.</span>
                        </div>
                    </div>
                )}

                {/* ================= MAIN CONTENT ================= */}
                <div className={`flex-1 px-4 relative z-20 ${activeTab === 'home' && !selectedCategory ? 'mt-4' : 'mt-4'}`}>                  
                    {/* VIEW A: HOME DASHBOARD */}
                    {activeTab === 'home' && (
                        <>
                           {!selectedCategory && (
                                <div className="space-y-6 animate-slide-up">
                                    
                                    {/* Categories Section (Fixed 2x2 Grid Paging) */}
                                    <div className="space-y-3">
                                        <div className="px-1">
                                            <div className="section-title">
                                                <span className="section-badge">📂</span>
                                                Categories
                                            </div>
                                        </div>

                                        {/* Categories Swipeable Pager (Pages of 4 structured in 2x2 Grid) */}
                                        <div className="glass rounded-[28px] p-3.5 border border-white/70 shadow-md">
                                            <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-6">
                                                {Array.from({ length: Math.ceil(categories.length / 4) }).map((_, pageIndex) => {
                                                    const pageCategories = categories.slice(pageIndex * 4, (pageIndex + 1) * 4);
                                                    
                                                    return (
                                                        <div key={pageIndex} className="min-w-full snap-center grid grid-cols-2 gap-3">
                                                            {pageCategories.map((cat, index) => {
                                                                const globalIndex = (pageIndex * 4) + index;
                                                                const token = getCatStyle(globalIndex);
                                                                
                                                                return (
                                                                    <button key={globalIndex} onClick={() => onSelectCategory(cat)} className="cat-tile">
                                                                        <div className="cat-icon-wrap" style={{ backgroundColor: token.bg }}>
                                                                            <span className="relative z-10">{cat.icon || token.emoji}</span>
                                                                        </div>
                                                                        <span className="text-[11px] font-bold text-[#3b2314] text-center leading-tight block w-full px-1 truncate">
                                                                            {cat.name}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            
                                            {/* Page Indicator Dots */}
                                            {categories.length > 4 && (
                                                <div className="flex justify-center gap-1.5 mt-3.5 mb-1">
                                                    {Array.from({ length: Math.ceil(categories.length / 4) }).map((_, i) => (
                                                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#3b2314]/20"></div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* ✨ AI SMART ASSISTANT & TOOLS HUBS (2x2 Grid Layout) */}
                                    <div className="space-y-3 pt-1">
                                        <div className="px-1">
                                            <div className="section-title">
                                                <span className="section-badge">✨</span>
                                                AI Smart Suite & Discovery
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button className="ai-grid-btn">
                                                <div className="ai-icon-circle">📸</div>
                                                <div className="text-center">
                                                    <p className="font-bold text-xs text-[#3b2314] m-0">Problem Scanner</p>
                                                    <p className="text-[10px] text-gray-500 m-0 mt-0.5 leading-tight">Visual diagnosis tool</p>
                                                </div>
                                            </button>
                                            <button className="ai-grid-btn">
                                                <div className="ai-icon-circle">🏗️</div>
                                                <div className="text-center">
                                                    <p className="font-bold text-xs text-[#3b2314] m-0">Project Planner</p>
                                                    <p className="text-[10px] text-gray-500 m-0 mt-0.5 leading-tight">Team architect builder</p>
                                                </div>
                                            </button>
                                            <button className="ai-grid-btn">
                                                <div className="ai-icon-circle">⭐</div>
                                                <div className="text-center">
                                                    <p className="font-bold text-xs text-[#3b2314] m-0">Top Rated Hub</p>
                                                    <p className="text-[10px] text-gray-500 m-0 mt-0.5 leading-tight">Browse elite operators</p>
                                                </div>
                                            </button>
                                            <button className="ai-grid-btn">
                                                <div className="ai-icon-circle">📈</div>
                                                <div className="text-center">
                                                    <p className="font-bold text-xs text-[#3b2314] m-0">Smart Estimate</p>
                                                    <p className="text-[10px] text-gray-500 m-0 mt-0.5 leading-tight">Predict dynamic costs</p>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            )}
                        </>
                    )}

                    {/* VIEW B: CHATS LIST */}
                    {activeTab === 'chats' && (
                        <div className="animate-slide-up space-y-3">
                            {conversations.length === 0 ? (
                                <div className="empty-state">
                                    <div className="w-13 h-13 bg-[#f5ede0] rounded-full flex items-center justify-center mx-auto mb-3 text-xl">💬</div>
                                    <h3 className="font-bold text-sm text-[#3b2314]">No messages yet</h3>
                                    <p className="text-xs text-gray-500 max-w-[200px] mx-auto mt-1">Book a dynamic service workspace to start coordination.</p>
                                    <button onClick={() => setActiveTab('home')} className="mt-4 btn-caramel text-xs">Find a Repairer</button>
                                </div>
                            ) : (
                                conversations.map((chat) => (
                                    <div key={chat.id} onClick={() => handleOpenChat(chat.booking_id)} className="list-row relative">
                                        {chat.unread_count > 0 && <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></div>}
                                        <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0 bg-gray-100">
                                            <img src={`https://ui-avatars.com/api/?name=${chat.other_user_name}&background=random`} className="h-full w-full object-cover" alt="" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h3 className="font-bold text-sm text-[#3b2314] truncate">{chat.other_user_name}</h3>
                                                <span className="text-[10px] text-gray-400 font-medium">{chat.last_message_time || 'Just now'}</span>
                                            </div>
                                            <div className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#f5ede0] text-[#5d3a1a] text-[9px] font-bold mb-1 border border-black/5">
                                                Job #{chat.booking_id} • {chat.service_type || 'Repair'}
                                            </div>
                                            <p className="text-xs text-gray-500 truncate font-medium">{chat.last_message_content || 'Chat interface opened'}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* VIEW C: HISTORY LIST */}
                    {activeTab === 'history' && (
                        <div className="animate-slide-up space-y-3">
                            {history.length === 0 ? (
                                <div className="empty-state">
                                    <div className="w-13 h-13 bg-[#f5ede0] rounded-full flex items-center justify-center mx-auto mb-3 text-xl">📋</div>
                                    <h3 className="font-bold text-sm text-[#3b2314]">Clean ledger</h3>
                                    <p className="text-xs text-gray-500 max-w-[200px] mx-auto mt-1">Completed assignments will reside here.</p>
                                </div>
                            ) : (
                                history.map((job) => (
                                    <div key={job.id} className="glass rounded-2xl p-4 border border-white/80 shadow-sm space-y-3">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                                    job.status === 'completed' ? 'bg-[#f5ede0] text-[#3b2314]' : 'bg-green-100 text-green-800'
                                                } border border-black/5`}>
                                                    {job.status}
                                                </span>
                                                <h3 className="font-bold text-[#3b2314] mt-2 text-base">{job.service_type}</h3>
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                {new Date(job.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{job.problem_description}</p>
                                        
                                        {job.status === 'completed' && (
                                            <div className="pt-1">
                                                {!job.review ? (
                                                    <button 
                                                        onClick={() => setReviewingJob(job)}
                                                        className="w-full py-2.5 bg-gradient-to-r from-[#b07d4a] to-[#7c5230] text-white font-bold rounded-xl text-xs shadow-md active:scale-[0.98] transition-transform"
                                                    >
                                                        ⭐ Leave an Evaluation Review
                                                    </button>
                                                ) : (
                                                    <div className="w-full py-2 bg-[#f5ede0]/60 text-[#7c5230] font-bold rounded-xl text-xs text-center border border-black/5">
                                                        You rated this operator {job.review.rating} ★
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* VIEW D: PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="animate-slide-up space-y-4">
                            <div className="glass p-4 rounded-2xl border border-white/80 shadow-sm flex items-center gap-4">
                                <div className="w-13 h-13 bg-gradient-to-tr from-[#b07d4a] to-[#3b2314] rounded-full p-0.5 border border-white/50 shadow-md">
                                    <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Guest'}&background=faf6f0&color=3b2314&bold=true&size=128`} className="w-full h-full rounded-full object-cover" alt="" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-base font-extrabold text-[#3b2314] truncate">{user?.name || 'Guest Account'}</h2>
                                    <p className="text-xs text-gray-500 truncate">{user?.email || 'No email bound'}</p>
                                </div>
                            </div>

                            <div className="glass p-1.5 rounded-2xl border border-white/80 shadow-sm divide-y divide-gray-100/60">
                                <button onClick={onSwitchToWork} className="w-full flex items-center justify-between px-3.5 py-3.5 hover:bg-white/40 rounded-xl transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-[#f5ede0] text-[#3b2314] flex items-center justify-center text-sm shadow-sm">⚡</div>
                                        <span className="text-xs font-bold text-gray-700">Switch to Repairer Mode</span>
                                    </div>
                                    <span className="text-gray-300 text-sm">→</span>
                                </button>
                                <button onClick={handleLogout} className="w-full flex items-center justify-between px-3.5 py-3.5 hover:bg-red-50/50 rounded-xl transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-sm shadow-sm">🚪</div>
                                        <span className="text-xs font-bold text-gray-700">Disconnect & Log Out</span>
                                    </div>
                                    <span className="text-gray-300 text-sm">→</span>
                                </button>
                            </div>
                            <div className="text-center text-[9px] text-gray-400 font-bold tracking-wider uppercase pt-4">FixMe Customer App v1.0 • App Store Build</div>
                        </div>
                    )}

                </div>

                {/* ================= BOTTOM NAVIGATION ================= */}
                <div className="fixed bottom-4 left-4 right-4 glass rounded-[24px] border border-white/80 py-3 px-4 flex justify-between items-center z-50 shadow-xl shadow-black/5">
                    <NavButton 
                        label="Browse" 
                        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />} 
                        isActive={activeTab === 'home'} 
                        onClick={() => { scrollToTop(); setActiveTab('home'); }} 
                    />
                    <NavButton 
                        label="Messages" 
                        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />} 
                        isActive={activeTab === 'chats'} 
                        onClick={() => setActiveTab('chats')}
                        badge={conversations.some(c => c.unread_count > 0)} 
                    />
                    <NavButton 
                        label="History" 
                        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />} 
                        isActive={activeTab === 'history'} 
                        onClick={() => setActiveTab('history')} 
                        badge={pendingReviewsCount > 0} 
                        badgeCount={pendingReviewsCount} 
                    />
                    <NavButton 
                        label="Profile" 
                        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />} 
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
        </>
    );
};

const NavButton = ({ label, icon, isActive, onClick, badge, badgeCount }) => (
    <button 
        onClick={onClick}
        className={`flex-1 flex flex-col items-center gap-1.5 transition-all relative ${
            isActive ? 'text-[#3b2314] scale-105' : 'text-gray-400'
        }`}
    >
        <div className="relative flex items-center justify-center">
            <svg className="w-5.5 h-5.5" fill={isActive ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                {icon}
            </svg>
            {badge && (
                <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 bg-[#e05252] rounded-full border border-white flex items-center justify-center shadow-sm">
                    {badgeCount > 0 && (
                        <span className="text-[8px] text-white font-extrabold leading-none px-0.5">
                            {badgeCount}
                        </span>
                    )}
                </span>
            )}
        </div>
        <span className="text-[9px] font-bold tracking-tight">{label}</span>
    </button>
);

export default MobileDashboard;