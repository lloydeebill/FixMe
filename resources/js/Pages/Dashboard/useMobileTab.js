import { useCallback, useEffect, useRef, useState } from 'react';

// Keep mobile dashboard views in browser history without changing backend routes.
export default function useMobileTab(defaultTab, aliases = {}) {
    const [tab, updateTab] = useState(() => aliases[new URLSearchParams(window.location.search).get('tab')] || new URLSearchParams(window.location.search).get('tab') || defaultTab);
    const currentTab = useRef(tab);

    useEffect(() => {
        const onBack = () => {
            const requested = new URLSearchParams(window.location.search).get('tab');
            const value = aliases[requested] || requested || defaultTab;
            currentTab.current = value;
            updateTab(value);
        };
        window.addEventListener('popstate', onBack);
        return () => window.removeEventListener('popstate', onBack);
    }, [defaultTab]);

    const setTab = useCallback(next => {
        const value = typeof next === 'function' ? next(currentTab.current) : next;
        if (value === currentTab.current) return;
        const url = new URL(window.location.href);
        if (value === defaultTab) url.searchParams.delete('tab');
        else url.searchParams.set('tab', value);
        const { skilllinkServiceStep, skilllinkJobStatus, skilllinkBookingView, ...previousState } = window.history.state || {};
        window.history.pushState({ ...previousState, skilllinkMobileNavigation: true }, '', url);
        currentTab.current = value;
        updateTab(value);
    }, [defaultTab]);

    const backTo = useCallback(fallback => {
        if (window.history.length > 1 && window.history.state?.skilllinkMobileNavigation) window.history.back();
        else setTab(fallback);
    }, [setTab]);

    return [tab, setTab, backTo];
}
