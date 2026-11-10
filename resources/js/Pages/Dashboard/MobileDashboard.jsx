import React, { useState, useEffect, useCallback, useRef } from 'react';
import { router } from '@inertiajs/react';
import { FiArrowLeft, FiArrowRight, FiBriefcase, FiCamera, FiCheckCircle, FiChevronRight, FiClock, FiHome, FiLink, FiLogOut, FiMapPin, FiMessageCircle, FiRefreshCw, FiSearch, FiStar, FiTool, FiUser, FiX } from 'react-icons/fi';
import ReviewModal from '../../Components/ReviewModal';
import ProblemScanner from '../../Components/ProblemScanner';
import ProjectPlanner from '../../Components/ProjectPlanner';
import styles from './MobileDashboard.module.css';

const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'S';

function EmptyState({ icon: Icon, title, children, action }) {
    return <div className={styles.empty}>
        <span className={styles.emptyIcon}><Icon aria-hidden="true" /></span>
        <h3>{title}</h3><p>{children}</p>{action}
    </div>;
}

function ProviderCard({ provider, onSelect }) {
    const profile = provider.repairer_profile;
    const name = profile?.business_name || provider.name || 'Service provider';
    const address = profile?.location?.address || provider.location?.address;
    const rating = Number(profile?.rating);
    return <article className={styles.provider}>
        <div className={styles.providerTop}>
            <span className={styles.avatar} aria-hidden="true">{initials(name)}</span>
            <div className={styles.providerIdentity}>
                <h3>{name}</h3>
                <p><FiMapPin aria-hidden="true" />{address || 'Location not provided'}</p>
            </div>
        </div>
        {!!profile?.skills?.length && <div className={styles.skills}>
            {profile.skills.slice(0, 3).map(skill => <span key={skill.id}>{skill.name}</span>)}
        </div>}
        <div className={styles.providerFooter}>
            {rating > 0 ? <span className={styles.rating}><FiStar aria-hidden="true" />{rating.toFixed(1)}<span>Rating</span></span> : <span className={styles.muted}>No ratings yet</span>}
            <button type="button" className={styles.primary} onClick={() => onSelect(provider)} aria-label={`Book ${name}`}>Book service <FiArrowRight aria-hidden="true" /></button>
        </div>
    </article>;
}

const MobileDashboard = ({
    user, appointment, categories = [], selectedCategory, onSelectCategory,
    repairers = [], onRepairerSelect, onSwitchToWork,
    history = [], conversations = [], pendingReviewsCount = 0,
}) => {
    const [activeTab, setActiveTab] = useState('home');
    const [reviewingJob, setReviewingJob] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [showAllCategories, setShowAllCategories] = useState(false);
    const pollingRef = useRef(null);

    // Keep the existing session-backed dashboard refresh and action paths.
    const softReload = useCallback(() => {
        router.reload({ only: ['conversations', 'history', 'appointment', 'pendingReviewsCount'] });
    }, []);

    useEffect(() => {
        const INTERVAL = 8000;
        if (activeTab === 'chats' || activeTab === 'history') {
            pollingRef.current = setInterval(softReload, INTERVAL);
        }
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [activeTab, softReload]);

    const handleLogout = () => router.post('/logout');
    const handleOpenChat = (bookingId) => router.visit(`/test-chat/${bookingId}`);

    useEffect(() => {
        if (activeTab === 'chats' || activeTab === 'history') {
            const id = setInterval(() => {
                router.reload({ only: ['conversations', 'history', 'appointment', 'pendingReviewsCount'] });
            }, 8000);
            return () => clearInterval(id);
        }
    }, [activeTab]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        onSelectCategory(null);
        setSearch('');
        setActiveTab('home');
    };
    const findProviders = () => {
        setActiveTab('home');
        onSelectCategory(null);
        setSearch('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const query = search.trim().toLocaleLowerCase();
    // The parent still owns category filtering and the original booking handler.
    const visibleProviders = repairers.filter(provider => {
        const profile = provider.repairer_profile;
        return [provider.name, profile?.business_name, ...profile?.skills?.map(skill => skill.name) || []]
            .filter(Boolean).join(' ').toLocaleLowerCase().includes(query);
    });
    const tabTitle = { chats: 'Messages', history: 'Job history', profile: 'My profile', scanner: 'Problem scanner', planner: 'Project planner' };

    return <div className={styles.dashboard}>
        <header className={styles.header}>
            <div className={styles.brand}><span className={styles.brandIcon}><FiLink aria-hidden="true" /></span>SkillLink<span className={styles.clientLabel}>Client</span></div>
            <button type="button" className={styles.profileButton} onClick={() => setActiveTab('profile')} aria-label="Open my profile">{initials(user?.name)}</button>
        </header>

        <main className={styles.main}>
            {activeTab === 'home' ? <>
                <section className={styles.welcome} aria-label="Find a service">
                    <p className={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'there'}</p>
                    <h1>What can we help with?</h1>
                    <p className={styles.location}><FiMapPin aria-hidden="true" /><span>{user?.location?.address || 'Your service community'}</span></p>
                    <div className={styles.search}>
                        <FiSearch aria-hidden="true" />
                        <input type="search" aria-label="Search providers or services" placeholder="Search providers or services" value={search} onChange={event => setSearch(event.target.value)} />
                        {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search"><FiX aria-hidden="true" /></button>}
                    </div>
                </section>

                {appointment?.exists && <section className={styles.appointment} aria-label="Upcoming appointment">
                    <span className={styles.appointmentIcon}><FiClock aria-hidden="true" /></span>
                    <div><p className={styles.eyebrow}>Upcoming appointment</p><h2>{appointment.type}</h2><p>{appointment.day} {appointment.month} · {appointment.time}</p>{appointment.repairer && <p>{appointment.repairer}</p>}</div>
                    <button type="button" onClick={() => handleOpenChat(appointment.id)} className={styles.iconButton} aria-label="Message about upcoming appointment"><FiMessageCircle aria-hidden="true" /></button>
                </section>}

                <section className={styles.section} aria-labelledby="skilllink-categories">
                    <div className={styles.sectionHeading}><h2 id="skilllink-categories">Services</h2>{categories.length > 8 && <button type="button" className={styles.textButton} aria-expanded={showAllCategories} aria-controls="skilllink-category-grid" onClick={() => setShowAllCategories(value => !value)}>{showAllCategories ? 'Show less' : 'See all'}</button>}</div>
                    <div className={styles.categories} id="skilllink-category-grid">
                        {(showAllCategories ? categories : categories.slice(0, 8)).map(category => <button type="button" key={category.slug} className={`${styles.category} ${selectedCategory?.slug === category.slug ? styles.selectedCategory : ''}`} aria-pressed={selectedCategory?.slug === category.slug} onClick={() => onSelectCategory(category)}>
                            <span className={styles.categoryIcon} aria-hidden="true">{category.icon || <FiTool />}</span><span>{category.name}</span>
                        </button>)}
                    </div>
                </section>

                <section className={styles.section} aria-labelledby="skilllink-assistance">
                    <div className={styles.sectionHeading}><h2 id="skilllink-assistance">A little help getting started</h2><span className={styles.aiLabel}>AI tools</span></div>
                    <div className={styles.tools}>
                        <button type="button" onClick={() => { setActiveTab('scanner'); window.scrollTo({ top: 0 }); }}><FiCamera aria-hidden="true" /><strong>Problem scanner</strong><span>Start with a photo</span><FiChevronRight className={styles.toolArrow} aria-hidden="true" /></button>
                        <button type="button" onClick={() => { setActiveTab('planner'); window.scrollTo({ top: 0 }); }}><FiTool aria-hidden="true" /><strong>Project planner</strong><span>Plan your next project</span><FiChevronRight className={styles.toolArrow} aria-hidden="true" /></button>
                    </div>
                </section>

                <section className={styles.section} aria-labelledby="skilllink-providers">
                    <div className={styles.sectionHeading}><h2 id="skilllink-providers">{selectedCategory ? selectedCategory.name : 'Service providers'}</h2><span className={styles.resultCount} aria-live="polite">{visibleProviders.length} found</span></div>
                    {selectedCategory && <button type="button" onClick={() => onSelectCategory(null)} className={styles.filterChip}>{selectedCategory.name}<FiX aria-hidden="true" /><span className={styles.srOnly}>Clear category filter</span></button>}
                    {visibleProviders.length ? <div className={styles.stack}>{visibleProviders.map(provider => <ProviderCard key={provider.user_id || provider.id} provider={provider} onSelect={onRepairerSelect} />)}</div> : <EmptyState icon={FiSearch} title="No providers found">{query || selectedCategory ? 'Try another service or search term.' : 'Providers will appear here when they join the community.'}{(query || selectedCategory) && <button type="button" className={styles.textButton} onClick={() => { setSearch(''); onSelectCategory(null); }}>Clear filters</button>}</EmptyState>}
                </section>
            </> : <>
                <div className={styles.pageHeading}><button type="button" className={styles.iconButton} onClick={() => setActiveTab('home')} aria-label="Back to browse"><FiArrowLeft aria-hidden="true" /></button><h1>{tabTitle[activeTab]}</h1></div>
                <div className={styles.tabContent}>
                    {activeTab === 'chats' && <>
                        <div className={styles.refreshRow}><button type="button" className={styles.textButton} onClick={() => { setIsRefreshing(true); router.reload({ only: ['conversations'], onFinish: () => setIsRefreshing(false) }); }}><FiRefreshCw aria-hidden="true" />{isRefreshing ? 'Refreshing…' : 'Refresh'}</button></div>
                        {conversations.length === 0 ? <EmptyState icon={FiMessageCircle} title="No messages yet" action={<button type="button" className={styles.primary} onClick={() => setActiveTab('home')}>Find a provider</button>}>Your booking conversations will appear here.</EmptyState> : <div className={styles.stack}>{conversations.map(chat => <button type="button" key={chat.id} className={styles.chat} onClick={() => handleOpenChat(chat.booking_id)}>
                            <span className={styles.avatar} aria-hidden="true">{initials(chat.other_user_name)}</span><span className={styles.chatText}><strong>{chat.other_user_name}</strong><small>Job #{chat.booking_id} · {chat.service_type || 'Repair'}</small><span>{chat.last_message_content || 'Open conversation'}</span><small>{chat.last_message_time}</small></span>{chat.unread_count > 0 && <span className={styles.unread} aria-label="Unread messages" />}<FiChevronRight aria-hidden="true" />
                        </button>)}</div>}
                    </>}
                    {activeTab === 'history' && (history.length === 0 ? <EmptyState icon={FiClock} title="No completed jobs yet">Your completed services and reviews will appear here.</EmptyState> : <div className={styles.stack}>{history.map(job => <article className={styles.historyCard} key={job.id}>
                        <div className={styles.historyMeta}><span><FiCheckCircle aria-hidden="true" />{job.status}</span><time>{new Date(job.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time></div>
                        <h2>{job.service_type}</h2><p>{job.problem_description}</p>
                        {job.status === 'completed' && (!job.review ? <button type="button" className={styles.primary} onClick={() => setReviewingJob(job)}><FiStar aria-hidden="true" />Leave a review</button> : <p className={styles.rating}><FiStar aria-hidden="true" />Your rating: {job.review.rating}</p>)}
                    </article>)}</div>)}
                    {activeTab === 'profile' && <>
                        <div className={styles.profileCard}><span className={styles.avatar} aria-hidden="true">{initials(user?.name)}</span><div><h2>{user?.name || 'Your profile'}</h2><p>{user?.email}</p></div></div>
                        <div className={styles.profileActions}><button type="button" onClick={onSwitchToWork}><FiBriefcase aria-hidden="true" /><span>Switch to Provider Mode</span><FiChevronRight aria-hidden="true" /></button><button type="button" onClick={handleLogout}><FiLogOut aria-hidden="true" /><span>Log out</span><FiChevronRight aria-hidden="true" /></button></div>
                        <p className={styles.profileFooter}>SkillLink · Client account</p>
                    </>}
                    {activeTab === 'scanner' && <div className={styles.legacyTools}><ProblemScanner onBack={() => setActiveTab('home')} onFindFixer={findProviders} /></div>}
                    {activeTab === 'planner' && <div className={styles.legacyTools}><ProjectPlanner onBack={() => setActiveTab('home')} onFindFixer={findProviders} /></div>}
                </div>
            </>}
        </main>

        <nav className={styles.navigation} aria-label="Client navigation">
            <NavButton label="Browse" icon={FiHome} isActive={activeTab === 'home'} onClick={scrollToTop} />
            <NavButton label="Messages" icon={FiMessageCircle} isActive={activeTab === 'chats'} onClick={() => setActiveTab('chats')} badge={conversations.some(chat => chat.unread_count > 0)} />
            <NavButton label="History" icon={FiClock} isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} badge={pendingReviewsCount > 0} badgeCount={pendingReviewsCount} />
            <NavButton label="Profile" icon={FiUser} isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </nav>
        {reviewingJob && <ReviewModal booking={reviewingJob} onClose={() => setReviewingJob(null)} />}
    </div>;
};

function NavButton({ label, icon: Icon, isActive, onClick, badge, badgeCount }) {
    return <button type="button" onClick={onClick} className={`${styles.navButton} ${isActive ? styles.activeNav : ''}`} aria-current={isActive ? 'page' : undefined}>
        <span className={styles.navIcon}><Icon aria-hidden="true" />{badge && <span className={styles.badge} aria-label={badgeCount > 0 ? `${badgeCount} pending reviews` : 'Unread messages'}>{badgeCount > 0 ? badgeCount : ''}</span>}</span><span>{label}</span>
    </button>;
}

export default MobileDashboard;
