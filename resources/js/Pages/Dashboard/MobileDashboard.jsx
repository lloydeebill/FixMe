import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { FiArrowLeft, FiArrowRight, FiBell, FiBriefcase, FiCamera, FiCheckCircle, FiChevronRight, FiClock, FiGrid, FiHome, FiLogOut, FiMapPin, FiMessageCircle, FiSearch, FiSettings, FiStar, FiTool, FiUser, FiX } from 'react-icons/fi';
import ReviewModal from '../../Components/ReviewModal';
import ProblemScanner from '../../Components/ProblemScanner';
import ProjectPlanner from '../../Components/ProjectPlanner';
import styles from './MobileDashboard.module.css';
import { groupIcons, categoryIcons } from './ServiceCatalog';
import { filterProvidersBySearch, groupCategories, searchCategories } from './catalog';
import { aiServiceDestination } from './aiCategory';
import ProviderLocationMap from './ProviderLocationMap';
import useMobileTab from './useMobileTab';
import NotificationsView from './NotificationsView';
import JobContextFields from './JobContextFields';

const initials = name => String(name || '').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'S';

function EmptyState({ icon: Icon, title, children, action }) {
    return <div className={styles.empty}>
        <span className={styles.emptyIcon}><Icon aria-hidden="true" /></span>
        <h3>{title}</h3><p>{children}</p>{action}
    </div>;
}

function ProviderCard({ provider, onSelect }) {
    const profile = provider.repairer_profile;
    const name = profile?.business_name || provider.name || 'Service provider';
    const address = profile?.location?.address;
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
        {provider.suggestion && <p className={styles.suggestionReason}>Service match · {provider.suggestion.distance_km === null ? 'Distance unavailable' : `about ${provider.suggestion.distance_km} km straight-line`} · {provider.suggestion.availability === 'not_checked' ? 'Availability not assessed' : provider.suggestion.availability === 'available' ? 'Available at selected time' : 'Unavailable at selected time'}</p>}
        <div className={styles.providerFooter}>
            {rating > 0 ? <span className={styles.rating}><FiStar aria-hidden="true" />{rating.toFixed(1)}<span>Rating</span></span> : <span className={styles.muted}>No ratings yet</span>}
            <button type="button" className={styles.primary} onClick={() => onSelect(provider)} aria-label={`View ${name}`}>View provider <FiArrowRight aria-hidden="true" /></button>
        </div>
    </article>;
}

const MobileDashboard = ({
    user, appointment, categories = [], selectedCategory, onSelectCategory,
    repairers = [], allRepairers = [], onRepairerSelect, onSwitchToWork,
    pilotAreas = {}, jobContext, onJobContextChange, suggestionsLoading = false, suggestionsError = '',
    history = [], completionJobs = [], conversations = [], notifications = [], unreadNotificationsCount = 0, onOpenNotification, pendingReviewsCount = 0,
}) => {
    const [activeTab, setActiveTab, backTo] = useMobileTab('home', { history: 'bookings', upcoming: 'bookings' });
    const [bookingsView, setBookingsView] = useState(() => new URLSearchParams(window.location.search).get('tab') === 'history' ? 'history' : 'upcoming');
    const [reviewingJob, setReviewingJob] = useState(null);
    const [search, setSearch] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [activeGroup, setActiveGroup] = useState(null);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [providerReturn, setProviderReturn] = useState('services');
    const searchInputRef = useRef(null);
    const homeSearchRef = useRef(null);
    const searchSheetRef = useRef(null);

    useEffect(() => {
        const restoreServiceStep = event => {
            const step = event.state?.skilllinkServiceStep;
            setActiveGroup(step?.group || null);
            onSelectCategory(step?.categorySlug ? categories.find(category => category.slug === step.categorySlug) || null : null);
        };
        window.addEventListener('popstate', restoreServiceStep);
        return () => window.removeEventListener('popstate', restoreServiceStep);
    }, [categories, onSelectCategory]);

    useEffect(() => {
        const restoreBookingsView = event => setBookingsView(event.state?.skilllinkBookingView || (new URLSearchParams(window.location.search).get('tab') === 'history' ? 'history' : 'upcoming'));
        window.addEventListener('popstate', restoreBookingsView);
        return () => window.removeEventListener('popstate', restoreBookingsView);
    }, []);

    const openBookingsView = view => {
        if (view !== bookingsView) window.history.pushState({ ...window.history.state, skilllinkMobileNavigation: true, skilllinkBookingView: view }, '', window.location.href);
        setBookingsView(view);
    };

    const recordServiceStep = (group, category = null) => {
        window.history.pushState({ ...window.history.state, skilllinkMobileNavigation: true, skilllinkServiceStep: { group, categorySlug: category?.slug || null } }, '', window.location.href);
    };
    const selectServiceCategory = category => {
        onSelectCategory(category);
        recordServiceStep(activeGroup, category);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };


    const handleLogout = () => router.post('/logout');
    const handleOpenChat = (bookingId) => router.visit(`/test-chat/${bookingId}`);


    useEffect(() => {
        if (!searchOpen) return;
        searchInputRef.current?.focus();
        const onKeyDown = event => {
            if (event.key === 'Escape') { closeSearch(); return; }
            if (event.key !== 'Tab') return;
            const controls = [...(searchSheetRef.current?.querySelectorAll('button:not(:disabled), input:not(:disabled)') || [])];
            if (!controls.length) return;
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        };
        const onBack = () => setSearchOpen(false);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('popstate', onBack);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('popstate', onBack);
        };
    }, [searchOpen]);

    const goHome = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        onSelectCategory(null);
        setActiveGroup(null);
        setSelectedProvider(null);
        setSearch('');
        setActiveTab('home');
    };
    const findProviders = () => {
        setActiveTab('services');
        setActiveGroup(null);
        onSelectCategory(null);
        setSearch('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const openGroup = group => {
        setActiveGroup(group);
        onSelectCategory(null);
        setActiveTab('services');
        recordServiceStep(group);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const openAiProviders = category => {
        const destination = aiServiceDestination(categories, category);
        if (!destination) return;
        setActiveGroup(destination.group);
        onSelectCategory(destination.category);
        setActiveTab(destination.tab);
        recordServiceStep(destination.group, destination.category);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const openProvider = (provider, origin = 'services') => {
        setSelectedProvider(provider);
        setProviderReturn(origin);
        setActiveTab('provider');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const openSearch = () => {
        if (searchOpen) return;
        window.history.pushState({ ...window.history.state, skilllinkSearch: true }, '', window.location.href);
        setSearchOpen(true);
    };
    const closeSearch = () => {
        setSearch('');
        setSearchOpen(false);
        if (window.history.state?.skilllinkSearch) window.history.back();
        homeSearchRef.current?.blur();
    };
    const finishSearch = () => {
        setSearchOpen(false);
        setSearch('');
        if (window.history.state?.skilllinkSearch) {
            const { skilllinkSearch, ...state } = window.history.state;
            window.history.replaceState(state, '', window.location.href);
        }
    };
    const backFromServices = () => {
        if (window.history.state?.skilllinkServiceStep) { window.history.back(); return; }
        if (selectedCategory) onSelectCategory(null);
        else if (activeGroup) setActiveGroup(null);
        else goHome();
    };
    const groups = groupCategories(categories);
    const searchMatches = searchCategories(categories, search);
    const searchProviders = filterProvidersBySearch(allRepairers, categories, search);
    const tabTitle = { ai: 'Ask AI for Help', upcoming: 'Upcoming Booking', chats: 'Messages', bookings: 'Bookings', notifications: 'Notifications', settings: 'Settings', scanner: 'Problem scanner', planner: 'Project planner' };

    return <div className={styles.dashboard}>
        <header className={styles.header}>
            {activeTab === 'settings' || activeTab === 'notifications' ? <h1 className={styles.mainTabTitle}>{activeTab === 'settings' ? 'Settings' : 'Notifications'}</h1> : <div className={styles.brand} aria-label="SkillLink"><span className={styles.brandIcon} aria-hidden="true">S</span></div>}
            {activeTab === 'home' && <div className={styles.headerActions}><span className={styles.headerGreeting}>Hello, {user?.name?.trim().split(/\s+/)[0] || 'there'}</span><button type="button" className={styles.profileButton} onClick={() => router.visit('/settings?section=client-profile&from=home')} aria-label="Open profile">{initials(user?.name)}</button></div>}
        </header>

        <main className={styles.main}>
            {activeTab === 'home' ? <>
                <section className={styles.welcome} aria-label="Find a service">
                    <h1>Find the right help for today.</h1>
                    <div className={styles.search}><FiSearch aria-hidden="true" /><input ref={homeSearchRef} type="search" aria-label="Search for a service or skill" placeholder="Search for a service or skill." value={search} onFocus={openSearch} onChange={event => { setSearch(event.target.value); openSearch(); }} /></div>
                </section>

                <section className={styles.section} aria-label="Quick actions"><div className={styles.homeActions}>
                    <button type="button" className={styles.homeAction} onClick={findProviders}><span><FiGrid aria-hidden="true" /></span><strong>Explore Services</strong><small>Browse service groups</small><FiArrowRight aria-hidden="true" /></button>
                    <button type="button" className={styles.homeAction} onClick={() => setActiveTab('ai')}><span><FiTool aria-hidden="true" /></span><strong>Ask AI for Help</strong><small>Scan or plan a project</small><FiArrowRight aria-hidden="true" /></button>
                    <button type="button" className={styles.homeAction} onClick={() => { setBookingsView('upcoming'); setActiveTab('bookings'); }}><span><FiClock aria-hidden="true" /></span><strong>Upcoming Booking</strong>{appointment?.exists ? <small>{appointment.type}{appointment.repairer ? ` · ${appointment.repairer}` : ''}<br />{appointment.day} {appointment.month} · {appointment.time}</small> : <small>See your next booking</small>}<FiArrowRight aria-hidden="true" /></button>
                    <button type="button" className={styles.homeAction} onClick={() => setActiveTab('chats')}><span><FiMessageCircle aria-hidden="true" /></span><strong>Messages</strong><small>Open conversations</small><FiArrowRight aria-hidden="true" /></button>
                </div></section>
                <section className={styles.aiPromos} aria-label="AI assistance">
                    <article className={`${styles.aiPromo} ${styles.plannerPromo}`}><span><FiTool aria-hidden="true" /></span><h2>Planning a project?</h2><p>Describe your project, get a simple plan, and find providers who may help.</p><button type="button" onClick={() => setActiveTab('planner')}>Try AI Project Planner <FiArrowRight aria-hidden="true" /></button></article>
                    <article className={`${styles.aiPromo} ${styles.scannerPromo}`}><span><FiCamera aria-hidden="true" /></span><h2>Not sure what’s wrong?</h2><p>Photograph a problem for an initial assessment and find a relevant provider.</p><button type="button" onClick={() => setActiveTab('scanner')}>Scan a Problem <FiArrowRight aria-hidden="true" /></button></article>
                </section>
            </> : activeTab === 'services' ? <>
                <div className={styles.pageHeading}><button type="button" className={styles.iconButton} onClick={backFromServices} aria-label={selectedCategory ? 'Back to categories' : activeGroup ? 'Back to service groups' : 'Back to Home'}><FiArrowLeft aria-hidden="true" /></button><div><p className={styles.eyebrow}>Services</p><h1>{selectedCategory?.name || activeGroup || 'All services'}</h1></div></div>
                <div className={styles.tabContent}>
                    {!activeGroup && <div className={styles.groupGrid}>
                        {Object.entries(groups).map(([name, items]) => {
                            const Icon = groupIcons[name] || FiTool;
                            return <button type="button" key={name} className={styles.groupTile} onClick={() => openGroup(name)}><span className={styles.groupIllustration}><Icon aria-hidden="true" /></span><strong>{name}</strong><small>{items.length} services <FiArrowRight aria-hidden="true" /></small></button>;
                        })}
                    </div>}
                    {activeGroup && !selectedCategory && <div className={styles.serviceGrid}>
                        {(groups[activeGroup] || []).map(category => {
                            const Icon = categoryIcons[category.slug] || FiTool;
                            return <button type="button" key={category.slug} className={styles.serviceTile} onClick={() => selectServiceCategory(category)}><span><Icon aria-hidden="true" /></span><strong>{category.name}</strong>{category.description && <small>{category.description}</small>}<FiArrowRight aria-hidden="true" className={styles.serviceArrow} /></button>;
                        })}
                    </div>}
                    {selectedCategory && <section aria-label={`${selectedCategory.name} providers`}>
                        <JobContextFields value={jobContext} onChange={onJobContextChange} pilotAreas={pilotAreas} accountLocation={user?.location} />
                        <h2 className={styles.providersHeading} style={{ marginTop: 18 }}>Suggested providers for {selectedCategory.name}</h2>
                        {jobContext.area && <p className={styles.resultCount}>{repairers.length} providers found in {pilotAreas[jobContext.area]}</p>}
                        {!jobContext.area ? <p className={styles.searchHint}>Choose the job area to see providers who serve it.</p> : suggestionsLoading ? <p role="status" className={styles.searchHint}>Loading suggested providers…</p> : suggestionsError ? <p role="alert" className={styles.searchHint}>{suggestionsError}</p> : repairers.length ? <div className={styles.stack}>{repairers.map(provider => <ProviderCard key={provider.user_id || provider.id} provider={provider} onSelect={openProvider} />)}</div> : <EmptyState icon={FiSearch} title="No providers found" action={<button type="button" className={styles.primary} onClick={findProviders}>Explore Services</button>}>No providers offer this service in the chosen area yet.</EmptyState>}
                    </section>}
                </div>
            </> : activeTab === 'provider' && selectedProvider ? <>
                <div className={styles.pageHeading}><button type="button" className={styles.iconButton} onClick={() => backTo(providerReturn)} aria-label="Back to providers"><FiArrowLeft aria-hidden="true" /></button><h1>Provider details</h1></div>
                <div className={styles.tabContent}>
                    <section className={styles.providerDetail}>
                        <span className={styles.detailAvatar} aria-hidden="true">{initials(selectedProvider.repairer_profile?.business_name || selectedProvider.name)}</span>
                        <h2>{selectedProvider.repairer_profile?.business_name || selectedProvider.name}</h2>
                        {selectedProvider.repairer_profile?.bio && <p>{selectedProvider.repairer_profile.bio}</p>}
                        {!!selectedProvider.repairer_profile?.skills?.length && <><h3>Services offered</h3><div className={styles.skills}>{selectedProvider.repairer_profile.skills.map(skill => <span key={skill.id}>{skill.name}</span>)}</div></>}
                        <h3>Saved service location</h3>
                        <p><FiMapPin aria-hidden="true" /> {selectedProvider.repairer_profile?.location?.address || 'Location not provided'}</p>
                        <ProviderLocationMap location={selectedProvider.repairer_profile?.location} />
                        <p className={styles.locationNote}>Map shows the provider's saved service location, not live tracking.</p>
                    </section>
                    <button type="button" className={styles.detailBooking} onClick={() => onRepairerSelect(selectedProvider)}>Request booking <FiArrowRight aria-hidden="true" /></button>
                </div>
            </> : <>
                {activeTab !== 'settings' && activeTab !== 'notifications' && <div className={styles.pageHeading}><button type="button" className={styles.iconButton} onClick={() => backTo(activeTab === 'scanner' || activeTab === 'planner' ? 'ai' : 'home')} aria-label="Back"><FiArrowLeft aria-hidden="true" /></button><h1>{tabTitle[activeTab]}</h1></div>}
                <div className={styles.tabContent}>
                    {activeTab === 'bookings' && <div className={styles.bookingTabs}><button type="button" aria-current={bookingsView === 'upcoming' ? 'page' : undefined} onClick={() => openBookingsView('upcoming')}>Upcoming</button><button type="button" aria-current={bookingsView === 'history' ? 'page' : undefined} onClick={() => openBookingsView('history')}>History</button></div>}
                    {activeTab === 'ai' && <div className={styles.actionChoices}>
                        <button type="button" onClick={() => setActiveTab('scanner')}><FiCamera aria-hidden="true" /><span><strong>Problem Scanner</strong><small>Use the existing scanner</small></span><FiChevronRight aria-hidden="true" /></button>
                        <button type="button" onClick={() => setActiveTab('planner')}><FiTool aria-hidden="true" /><span><strong>Project Planner</strong><small>Use the existing planner</small></span><FiChevronRight aria-hidden="true" /></button>
                    </div>}
                    {activeTab === 'notifications' && <NotificationsView notifications={notifications} onOpen={onOpenNotification} />}
                    {activeTab === 'bookings' && bookingsView === 'upcoming' && (appointment?.exists ? <section className={styles.historyCard}>
                        <div className={styles.historyMeta}><span><FiClock aria-hidden="true" />Upcoming booking</span></div>
                        <h2>{appointment.type}{appointment.repairer ? ` · ${appointment.repairer}` : ''}</h2><p>{appointment.day} {appointment.month} · {appointment.time}</p>
                        <div className={styles.bookingActions}><button type="button" className={styles.primary} onClick={() => router.visit(`/bookings/${appointment.id}`)}>View booking details</button>
                        <button type="button" className={styles.textButton} onClick={() => handleOpenChat(appointment.id)}>Open conversation</button></div>
                    </section> : <EmptyState icon={FiClock} title="No upcoming bookings" action={<button type="button" className={styles.primary} onClick={findProviders}>Explore Services</button>}>Find a service when you need one.</EmptyState>)}
                    {activeTab === 'chats' && <>
                        {conversations.length === 0 ? <EmptyState icon={FiMessageCircle} title="No messages yet" action={<button type="button" className={styles.primary} onClick={() => setActiveTab('home')}>Find a provider</button>}>Your booking conversations will appear here.</EmptyState> : <div className={styles.stack}>{conversations.map(chat => <button type="button" key={chat.id} className={styles.chat} onClick={() => handleOpenChat(chat.booking_id)}>
                            <span className={styles.avatar} aria-hidden="true">{initials(chat.other_user_name)}</span><span className={styles.chatText}><strong>{chat.other_user_name}</strong><small>Job #{chat.booking_id} · {chat.service_type || 'Repair'}</small><span>{chat.last_message_content ?? 'No messages yet'}</span>{chat.last_message_time && <small>{chat.last_message_time}</small>}</span><FiChevronRight aria-hidden="true" />
                        </button>)}</div>}
                    </>}
                    {activeTab === 'bookings' && bookingsView === 'history' && <div className={styles.stack}>
                        {completionJobs.map(job => <article className={styles.historyCard} key={job.id}>
                            <div className={styles.historyMeta}><span>{job.status === 'completion_disputed' ? 'Issue reported' : 'Confirm work'}</span></div>
                            <h2>{job.service_type}</h2>{job.completion_issue_reason && <p>{job.completion_issue_reason}</p>}
                            <button type="button" className={styles.primary} onClick={() => router.visit(`/bookings/${job.id}`)}>View completion details</button>
                        </article>)}
                        {history.length === 0 && completionJobs.length === 0 && <EmptyState icon={FiClock} title="No completed jobs yet">Your completed services and reviews will appear here.</EmptyState>}
                        {history.map(job => <article className={styles.historyCard} key={job.id}>
                        <div className={styles.historyMeta}><span><FiCheckCircle aria-hidden="true" />{job.status}</span><time>{new Date(job.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time></div>
                        <h2>{job.service_type}</h2><p>{job.problem_description}</p>
                        <button type="button" className={styles.textButton} onClick={() => router.visit(`/bookings/${job.id}`)}>Work & payment details</button>
                        {job.client_accepted_at && (!job.review ? <button type="button" className={styles.primary} onClick={() => setReviewingJob(job)}><FiStar aria-hidden="true" />Leave a review</button> : <p className={styles.rating}><FiStar aria-hidden="true" />Your rating: {job.review.rating}</p>)}
                    </article>)}
                    </div>}
                    {activeTab === 'settings' && <div className={styles.settingsRows}>
                        <button type="button" onClick={() => router.visit('/settings?section=client-profile')}><span className={styles.settingsIcon}><FiUser aria-hidden="true" /></span><span className={styles.settingsLabel}><strong>Profile</strong><small>Edit your account information</small></span><FiChevronRight aria-hidden="true" /></button>
                        <button type="button" onClick={onSwitchToWork}><span className={styles.settingsIcon}><FiBriefcase aria-hidden="true" /></span><span className={styles.settingsLabel}><strong>{user?.is_repairer ? 'Switch to Provider' : 'Offer Services'}</strong><small>{user?.is_repairer ? 'Open your provider workspace' : 'Set up a provider profile'}</small></span><FiChevronRight aria-hidden="true" /></button>
                        <button type="button" onClick={handleLogout}><span className={styles.settingsIcon}><FiLogOut aria-hidden="true" /></span><span className={styles.settingsLabel}><strong>Log Out</strong><small>End this session</small></span><FiChevronRight aria-hidden="true" /></button>
                    </div>}
                    {activeTab === 'scanner' && <div className={styles.legacyTools}><ProblemScanner onBack={() => setActiveTab('ai')} onFindFixer={findProviders} catalogCategories={categories} onSelectCategory={openAiProviders} /></div>}
                    {activeTab === 'planner' && <div className={styles.legacyTools}><ProjectPlanner onBack={() => setActiveTab('ai')} onFindFixer={findProviders} catalogCategories={categories} onSelectCategory={openAiProviders} /></div>}
                </div>
            </>}
        </main>

        {searchOpen && <div className={styles.searchOverlay} onMouseDown={event => { if (event.target === event.currentTarget) closeSearch(); }}>
            <section ref={searchSheetRef} className={styles.searchSheet} role="dialog" aria-modal="true" aria-label="Search services and providers">
                <div className={styles.searchSheetHeading}><h2>Search services and providers</h2><button type="button" onClick={closeSearch} aria-label="Close search"><FiX aria-hidden="true" /></button></div>
                <div className={styles.search}><FiSearch aria-hidden="true" /><input ref={searchInputRef} type="search" aria-label="Search providers or services" placeholder="Try table skirting" value={search} onChange={event => setSearch(event.target.value)} />{search && <button type="button" onClick={() => { setSearch(''); searchInputRef.current?.focus(); }} aria-label="Clear search"><FiX aria-hidden="true" /></button>}</div>
                {!search.trim() ? <p className={styles.searchHint}>Search by service, task, or provider name.</p> : <div className={styles.searchSheetResults}>
                    {searchMatches.length > 0 && <section className={styles.searchResults}><h3>Services</h3>{searchMatches.map(category => <button type="button" key={category.slug} onClick={() => { finishSearch(); setActiveGroup(category.service_group); onSelectCategory(category); setActiveTab('services'); recordServiceStep(category.service_group, category); }}><FiTool aria-hidden="true" /><span>{category.name}<small>{category.service_group}</small></span><FiChevronRight aria-hidden="true" /></button>)}</section>}
                    {searchProviders.length > 0 && <section className={styles.searchResults}><h3>Providers</h3>{searchProviders.map(provider => <ProviderCard key={provider.user_id || provider.id} provider={provider} onSelect={item => {
                        const matched = searchMatches.find(category => item.repairer_profile?.skills?.some(skill => skill.slug === category.slug));
                        finishSearch();
                        onSelectCategory(matched || null);
                        setActiveGroup(matched?.service_group || null);
                        setActiveTab('services');
                        openProvider(item, 'services');
                    }} />)}</section>}
                    {!searchMatches.length && !searchProviders.length && <p className={styles.searchHint}>No matching services or providers found.</p>}
                </div>}
            </section>
        </div>}

        <nav className={styles.navigation} aria-label="Client navigation">
            <NavButton label="Home" icon={FiHome} isActive={activeTab === 'home'} onClick={goHome} />
            <NavButton label="Notifications" icon={FiBell} isActive={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} badge={unreadNotificationsCount > 0} badgeCount={unreadNotificationsCount} />
            <NavButton label="Settings" icon={FiSettings} isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
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
