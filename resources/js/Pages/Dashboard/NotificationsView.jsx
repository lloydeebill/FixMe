import React, { useEffect } from 'react';
import { FiBell, FiChevronRight } from 'react-icons/fi';

const titles = {
    new_message: 'New message',
    booking_requested: 'New booking request',
    booking_approved: 'Booking approved',
    booking_rejected: 'Booking declined',
    completion_requested: 'Work completion needs confirmation',
    completion_disputed: 'Client reported a work issue',
    completion_accepted: 'Client accepted completed work',
    payment_declared: 'Client reported payment',
    payment_confirmed: 'Provider confirmed payment receipt',
};

export default function NotificationsView({ notifications = [], onOpen }) {
    useEffect(() => {
        const saved = window.sessionStorage.getItem('skilllink.notificationScroll');
        if (saved === null) return;
        window.sessionStorage.removeItem('skilllink.notificationScroll');
        const frame = window.requestAnimationFrame(() => window.scrollTo(0, Number(saved) || 0));
        return () => window.cancelAnimationFrame(frame);
    }, []);
    return <section aria-label="Notifications" className="space-y-3">
        {notifications.length === 0 ? <div className="rounded-2xl border border-[#e3e8ef] bg-white px-5 py-10 text-center"><FiBell className="mx-auto text-3xl text-[#0965e8]" aria-hidden="true" /><h2 className="mt-3 text-base font-semibold text-[#172335]">No notifications yet</h2><p className="mt-1 text-sm text-[#647084]">New booking, message, work, and payment updates will appear here.</p></div> : notifications.map(notice =>
            <button type="button" key={notice.id} onClick={() => onOpen(notice.id)} className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left ${notice.read ? 'border-[#e3e8ef] bg-white' : 'border-[#cbdcf6] bg-[#edf4ff]'}`}>
                <span className="mt-1 text-lg text-[#0965e8]"><FiBell aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><strong className="block text-sm text-[#172335]">{titles[notice.type] || 'Booking update'}</strong>{notice.service_type && <span className="mt-1 block text-xs text-[#647084]">{notice.service_type}</span>}{notice.type === 'booking_requested' && notice.job_description && <span className="mt-1 block line-clamp-2 text-xs text-[#475569]">{notice.job_description}</span>}<time dateTime={notice.created_at} className="mt-1 block text-xs text-[#647084]">{notice.time}</time></span>
                {!notice.read && <span className="mt-2 h-2 w-2 rounded-full bg-[#0965e8]" aria-label="Unread" />}
                <FiChevronRight className="mt-1 text-[#94a3b8]" aria-hidden="true" />
            </button>
        )}
    </section>;
}
