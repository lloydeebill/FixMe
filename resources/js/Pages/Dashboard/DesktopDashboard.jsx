import './DesktopDashboard.css';
import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import ReviewModal from '../../Components/ReviewModal';

/* ─────────────────────────────────────────────────────────────
   LIQUID GLASS — SkillLink Dashboard  (warm earth-tone palette)
   visionOS / macOS Sonoma aesthetic with deep coffee browns
───────────────────────────────────────────────────────────── */

// ── Injected global styles ────────────────────────────────────


// ── Category palette ─────────────────────────────────────────
const CAT_COLORS = [
    { bg: 'rgba(176,125,74,0.18)',  emoji: '🔧' },
    { bg: 'rgba(100,160,120,0.18)', emoji: '⚡' },
    { bg: 'rgba(180,140,80,0.18)',  emoji: '🪚' },
    { bg: 'rgba(150,110,180,0.18)', emoji: '🔌' },
    { bg: 'rgba(80,160,200,0.18)',  emoji: '❄️' },
    { bg: 'rgba(200,120,80,0.18)',  emoji: '🧱' },
    { bg: 'rgba(100,180,160,0.18)', emoji: '🎨' },
    { bg: 'rgba(200,170,100,0.18)', emoji: '🧹' },
    { bg: 'rgba(80,170,100,0.18)',  emoji: '🌿' },
    { bg: 'rgba(70,140,200,0.18)',  emoji: '💻' },
    { bg: 'rgba(180,100,140,0.18)', emoji: '🧵' },
    { bg: 'rgba(140,110,90,0.18)',  emoji: '👟' },
];

// ── Small icon components ────────────────────────────────────
const ChevronDown = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);
const ChevronLeft = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
);
const ClockIcon = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const SwitchIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
);
const LogoutIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
);

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
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
    pendingReviewsCount = 0,
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [activeTab, setActiveTab]           = useState('browse');
    const [reviewingJob, setReviewingJob]     = useState(null);

    const handleLogout   = () => router.post('/logout');
    const handleOpenChat = (bookingId) => {
        if (!bookingId) return alert('Error: Booking ID missing.');
        router.visit(`/test-chat/${bookingId}`);
    };
    const unreadCount = conversations.filter(c => c.unread_count > 0).length;

    // ── Close dropdown on outside click ─────────────────────
    const dropdownRef = useRef(null);
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setIsDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Category icon resolver ───────────────────────────────
    const getCatStyle = (index) => CAT_COLORS[index % CAT_COLORS.length];

    // ── Sub-views ────────────────────────────────────────────

    const renderBrowse = () => (
        <>
            {/* Hero */}
            {!selectedCategory && (
                <div className="hero-card fade-up" style={{ marginBottom: 28 }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(200,169,122,0.85)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            Welcome back
                        </p>
                        <h1 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1, margin: '0 0 10px', fontFamily: "'DM Serif Display', serif" }}>
                            Hello, {user?.name?.split(' ')[0]}! 👋
                        </h1>
                        <p style={{ fontSize: 17, color: 'rgba(245,237,224,0.75)', fontWeight: 400 }}>
                            What needs fixing today?
                        </p>
                    </div>
                    {/* Background tool icon */}
                    <div style={{
                        position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)',
                        fontSize: 110, opacity: 0.07, userSelect: 'none', filter: 'blur(1px)',
                        lineHeight: 1,
                    }}>🛠️</div>
                    {/* Soft light orb */}
                    <div style={{
                        position: 'absolute', bottom: -40, left: '40%',
                        width: 200, height: 200, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(200,169,122,0.18) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }}/>
                </div>
            )}

            {/* Categories */}
            {!selectedCategory && (
                <div className="fade-up delay-1" style={{ marginBottom: 32 }}>
                    <div className="section-title">
                        <span className="section-badge">📂</span>
                        Categories
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12 }}>
                        {categories.map((cat, index) => {
                            const style = getCatStyle(index);
                            return (
                                <button key={index} className="cat-tile" onClick={() => onSelectCategory(cat)}>
                                    <div className="cat-icon-wrap" style={{ background: style.bg }}>
                                        <span style={{ position: 'relative', zIndex: 1 }}>
                                            {cat.icon || style.emoji}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--espresso)', textAlign: 'center', lineHeight: 1.3 }}>
                                        {cat.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Top Services */}
            {!selectedCategory && (
                <div className="fade-up delay-2">
                    <div className="section-title">
                        <span className="section-badge">⭐</span>
                        Top Services
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                        {topServices && topServices.length > 0 ? topServices.map((service, index) => (
                            <div key={index} className="service-card" onClick={() => onRepairerSelect(service)}>
                                <div style={{ display: 'flex', gap: 14, padding: '16px' }}>
                                    <div style={{
                                        width: 80, height: 80,
                                        borderRadius: 16, overflow: 'hidden',
                                        background: 'rgba(245,237,224,0.80)',
                                        flexShrink: 0, border: '1px solid rgba(255,255,255,0.70)',
                                    }}>
                                        <img src={service.image} alt={service.role} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--espresso)', margin: 0 }}>{service.role}</h3>
                                            <div className="star-badge">
                                                <span style={{ color: '#c8a97a' }}>★</span>
                                                <span>{service.rating}</span>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: 12, color: 'var(--mocha)', margin: '0 0 10px', fontWeight: 500 }}>{service.name}</p>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--caramel)' }}>Book Now →</span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                                <p style={{ color: 'var(--mocha)', opacity: 0.6 }}>No top services available.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Repairer list */}
            {selectedCategory && (
                <div className="fade-up">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                        <button className="back-btn" onClick={() => onSelectCategory(null)}>
                            <ChevronLeft/>
                        </button>
                        <div>
                            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--espresso)', margin: 0 }}>
                                {selectedCategory.name} Experts
                            </h2>
                            <p style={{ fontSize: 12, color: 'var(--mocha)', margin: '2px 0 0', fontWeight: 500 }}>
                                Found {repairers.length} professionals
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                        {repairers.length === 0 ? (
                            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                                <div style={{ fontSize: 52, marginBottom: 12 }}>🕵️</div>
                                <h3 style={{ fontWeight: 800, color: 'var(--espresso)', marginBottom: 4 }}>No repairers found</h3>
                                <button className="btn-caramel" style={{ marginTop: 16 }} onClick={() => onSelectCategory(null)}>
                                    View All Categories
                                </button>
                            </div>
                        ) : repairers.map((repairer) => (
                            <div key={repairer.id} className="repairer-card" onClick={() => onRepairerSelect(repairer)}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <div className="avatar-lg">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${repairer.repairer_profile.business_name}&background=random`}
                                            alt={repairer.repairer_profile.business_name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--espresso)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                                                {repairer.repairer_profile.business_name}
                                            </h3>
                                            <div className="star-badge">
                                                <span style={{ color: '#c8a97a' }}>★</span>
                                                <span>{repairer.repairer_profile.rating || 'New'}</span>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: 12, color: 'var(--mocha)', margin: '4px 0 0', fontWeight: 500 }}>
                                            📍 {repairer.location?.address || 'Davao City'}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                                    {repairer.repairer_profile.skills?.slice(0, 3).map(skill => (
                                        <span key={skill.id} className="skill-chip">{skill.name}</span>
                                    ))}
                                    {repairer.repairer_profile.skills?.length > 3 && (
                                        <span style={{ fontSize: 11, color: 'var(--latte)', fontWeight: 600, padding: '4px 8px' }}>
                                            +{repairer.repairer_profile.skills.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );

    const renderChats = () => (
        <div className="fade-up">
            <div className="section-title">
                <span className="section-badge">💬</span>
                Your Conversations
            </div>
            {conversations.length === 0 ? (
                <div className="empty-state">
                    <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                    <p style={{ color: 'var(--mocha)', fontWeight: 600, marginBottom: 8 }}>No messages yet.</p>
                    <button className="btn-caramel" onClick={() => setActiveTab('browse')}>Find a Repairer to Chat</button>
                </div>
            ) : conversations.map(chat => (
                <div key={chat.id} className="list-row" onClick={() => handleOpenChat(chat.booking_id)}>
                    <div style={{ position: 'relative' }}>
                        <div className="avatar-lg">
                            <img src={`https://ui-avatars.com/api/?name=${chat.other_user_name}&background=random`} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                        </div>
                        {chat.unread_count > 0 && <div className="unread-dot"/>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--espresso)', margin: 0 }}>{chat.other_user_name}</h3>
                            <span style={{ fontSize: 11, color: 'var(--latte)', fontWeight: 500 }}>{chat.last_message_time}</span>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--caramel)', fontWeight: 700, margin: '0 0 2px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Job #{chat.booking_id} · {chat.service_type}
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--mocha)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {chat.last_message_content}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderHistory = () => (
        <div className="fade-up">
            <div className="section-title">
                <span className="section-badge">📂</span>
                Job History
            </div>
            {history.length === 0 ? (
                <div className="empty-state">
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                    <p style={{ color: 'var(--mocha)', fontWeight: 600, marginBottom: 4 }}>No job history found.</p>
                    <p style={{ fontSize: 13, color: 'var(--latte)' }}>Completed jobs will appear here.</p>
                </div>
            ) : history.map(job => (
                <div key={job.id} className="list-row" style={{ flexWrap: 'wrap', gap: 12 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: 'rgba(176,125,74,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, flexShrink: 0,
                    }}>✅</div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--espresso)', margin: '0 0 3px' }}>{job.service_type}</h3>
                        <p style={{ fontSize: 12, color: 'var(--mocha)', margin: 0 }}>
                            Completed by <strong style={{ color: 'var(--espresso)' }}>{job.repairer_profile?.business_name || 'Repairer'}</strong>
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--latte)', margin: '3px 0 0' }}>
                            {new Date(job.scheduled_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                        {!job.review ? (
                            <button className="btn-caramel" onClick={(e) => { e.stopPropagation(); setReviewingJob(job); }}>
                                ⭐ Leave a Review
                            </button>
                        ) : (
                            <div style={{
                                padding: '8px 16px', borderRadius: 12,
                                background: 'rgba(245,237,224,0.60)',
                                border: '1px solid rgba(255,255,255,0.65)',
                                fontSize: 12, fontWeight: 600, color: 'var(--latte)',
                            }}>
                                Rated {job.review.rating} ★
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    // ── MAIN RENDER ──────────────────────────────────────────
    return (
        <div className="skilllink-desktop">
            <Head title="Dashboard — SkillLink"/>

            {/* Ambient background */}
            <div className="fixme-bg"/>

            <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', paddingBottom: 48 }}>

                {/* ── NAVBAR ─────────────────────────────────────── */}
                <div className="fixme-nav">
                    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                        {/* Logo + Tabs */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
                            <div
                                className="logo-text"
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                onClick={() => { onSelectCategory(null); setActiveTab('browse'); }}
                            >
                                SkillLink
                            </div>

                            <nav className="tab-pill">
                                <button className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
                                    onClick={() => { onSelectCategory(null); setActiveTab('browse'); }}>
                                    Browse Services
                                </button>
                                <button className={`tab-btn ${activeTab === 'chats' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('chats')}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    Messages
                                    {unreadCount > 0 && (
                                        <span style={{ background: '#e05252', color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 800, padding: '1px 6px' }}>
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                                <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('history')}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    Job History
                                    {pendingReviewsCount > 0 && (
                                        <span style={{ background: '#e05252', color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 800, padding: '1px 6px' }}>
                                            {pendingReviewsCount}
                                        </span>
                                    )}
                                </button>
                            </nav>
                        </div>

                        {/* Profile pill */}
                        <div style={{ position: 'relative' }} ref={dropdownRef}>
                            <div className="profile-pill" onClick={() => setIsDropdownOpen(v => !v)}>
                                <div className="avatar">{user.name.charAt(0)}</div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--espresso)' }}>{user.name}</span>
                                <ChevronDown/>
                            </div>

                            {isDropdownOpen && (
                                <div className="dropdown-menu">
                                    <button className="dropdown-item" onClick={() => { setIsDropdownOpen(false); onSwitchToWork(); }}>
                                        <div className="dropdown-icon"><SwitchIcon/></div>
                                        {user.is_repairer ? 'Switch to Work Mode' : 'Become a Pro'}
                                    </button>
                                    <div style={{ height: 1, background: 'rgba(176,125,74,0.15)', margin: '4px 14px' }}/>
                                    <button className="dropdown-item danger" onClick={handleLogout}>
                                        <div className="dropdown-icon"><LogoutIcon/></div>
                                        Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── BODY ───────────────────────────────────────── */}
                <div className="client-columns" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 28px 0', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

                    {/* ─ LEFT COLUMN ─────────────────────────────── */}
                    <div>
                        {activeTab === 'browse'  && renderBrowse()}
                        {activeTab === 'chats'   && renderChats()}
                        {activeTab === 'history' && renderHistory()}
                    </div>

                    {/* ─ RIGHT SIDEBAR ───────────────────────────── */}
                    <div style={{ position: 'sticky', top: 82, display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Next Job card */}
                        <div className="sidebar-card glass-edge">
                            <div className="nextjob-header">
                                <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(245,237,224,0.90)', margin: 0, position: 'relative', zIndex: 1 }}>
                                    Next Job
                                </h3>
                            </div>

                            <div style={{ padding: '22px 22px 24px' }}>
                                {appointment?.exists ? (
                                    <div style={{ textAlign: 'center' }}>
                                        <div className="date-badge" style={{ marginBottom: 16 }}>
                                            <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--espresso)', lineHeight: 1, fontFamily: "'DM Serif Display', serif" }}>
                                                {appointment.day}
                                            </span>
                                            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--caramel)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
                                                {appointment.month}
                                            </span>
                                        </div>
                                        <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--espresso)', margin: '0 0 4px' }}>{appointment.type}</h4>
                                        <p style={{ fontSize: 13, color: 'var(--mocha)', margin: '0 0 16px' }}>with {appointment.repairer}</p>
                                        <div className="time-row" style={{ marginBottom: 18 }}>
                                            <ClockIcon/>
                                            <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 15 }}>{appointment.time}</span>
                                        </div>
                                        <button className="btn-dark" onClick={() => handleOpenChat(appointment.id)}>
                                            💬 Chat with Repairer
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '18px 0' }}>
                                        <div style={{ fontSize: 44, marginBottom: 12 }}>🗓️</div>
                                        <p style={{ fontWeight: 700, color: 'var(--espresso)', margin: '0 0 6px', fontSize: 14 }}>No Upcoming Fixes</p>
                                        <p style={{ fontSize: 12, color: 'var(--latte)', margin: '0 0 22px' }}>Your schedule is currently empty.</p>
                                        <button className="btn-dark" onClick={() => { onSelectCategory(null); setActiveTab('browse'); }}>
                                            Find a Service
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Support card */}
                        <div className="support-card glass-edge">
                            <div style={{ fontSize: 26, marginBottom: 10 }}>🤝</div>
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--espresso)', margin: '0 0 6px' }}>Need Help?</h3>
                            <p style={{ fontSize: 12, color: 'var(--mocha)', lineHeight: 1.6, margin: '0 0 14px' }}>
                                Our support team is available 24/7 to assist with your repairs.
                            </p>
                            <a href="#" className="support-link">
                                Contact Support <span>→</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Review Modal */}
            {reviewingJob && (
                <ReviewModal
                    booking={reviewingJob}
                    onClose={() => setReviewingJob(null)}
                />
            )}
        </div>
    );
};

export default DesktopDashboard;