import '../../skilllink.css';
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from '@inertiajs/react';
import { mergeMessages, isIncomingForBooking } from './messageState';

export default function TestChat({ booking, currentUser, initialMessages }) {
    const returnQuery = new URLSearchParams(window.location.search);
    const backUrl = returnQuery.get('from') === 'notifications'
        ? `/app?tab=notifications${returnQuery.get('mode') === 'client' ? '&mode=client' : ''}`
        : '/app';
    const bookingId = Number(booking.id);
    const myUserId = Number(currentUser.user_id || currentUser.id);
    const [chatState, setChatState] = useState({ bookingId, items: initialMessages });
    const messages = chatState.bookingId === bookingId ? chatState.items : initialMessages;
    const messageListRef = useRef(null);
    const nearBottomRef = useRef(true);

    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState('');
    const [sendSuccess, setSendSuccess] = useState('');
    useEffect(() => {
        if (!sendSuccess) return;
        const timer = window.setTimeout(() => setSendSuccess(''), 5000);
        return () => window.clearTimeout(timer);
    }, [sendSuccess]);

    useEffect(() => {
        nearBottomRef.current = true;
        setChatState({ bookingId, items: initialMessages });
    }, [bookingId]);

    useEffect(() => {
        setChatState(current => current.bookingId === bookingId
            ? { ...current, items: mergeMessages(current.items, initialMessages) }
            : current);
    }, [bookingId, initialMessages]);

    useLayoutEffect(() => {
        const list = messageListRef.current;
        if (list && nearBottomRef.current) list.scrollTop = list.scrollHeight;
    }, [bookingId, messages]);

    useEffect(() => {
        let active = true;
        let requestController = null;
        const refreshMessages = async () => {
            if (!active || requestController) return;
            const request = new AbortController();
            requestController = request;
            try {
                const response = await fetch(`/api/messages/${bookingId}`, {
                    headers: { Accept: 'application/json' },
                    signal: request.signal,
                });
                if (!response.ok) return;
                const incoming = await response.json();
                if (active && Array.isArray(incoming)) {
                    setChatState(current => current.bookingId === bookingId
                        ? { ...current, items: mergeMessages(current.items, incoming) }
                        : current);
                }
            } catch {
                // A later poll can recover from a temporary network failure.
            } finally {
                if (requestController === request) requestController = null;
            }
        };

        refreshMessages();
        const timer = setInterval(refreshMessages, 5000);
        return () => {
            active = false;
            clearInterval(timer);
            requestController?.abort();
        };
    }, [bookingId]);

    useEffect(() => {
        if (!window.Echo) return;
        const channel = `messages.${myUserId}`;
        window.Echo.private(channel)
            .listen('.message.sent', (e) => {
                if (!isIncomingForBooking(e, bookingId, myUserId)) return;
                setChatState(current => current.bookingId === bookingId
                    ? { ...current, items: mergeMessages(current.items, [e.message]) }
                    : current);
            });

        return () => {
            window.Echo.leave(channel);
        };
    }, [bookingId, myUserId]);

    const submit = async (e) => {
        e.preventDefault();
        const submittedDraft = draft;
        const content = submittedDraft.trim();
        if (!content || sending) return;

        setSending(true);
        setSendError('');
        setSendSuccess('');
        try {
            const response = await fetch(`/api/messages/${bookingId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ message: content }),
            });
            if (!response.ok) throw new Error('Message send failed');

            const { message } = await response.json();
            if (!message?.id) throw new Error('Saved message ID missing');
            setChatState(current => current.bookingId === bookingId
                ? { ...current, items: mergeMessages(current.items, [message]) }
                : current);
            setDraft(current => current === submittedDraft ? '' : current);
            setSendSuccess('Message sent.');
        } catch {
            setSendError('Message could not be sent. Check the conversation before retrying.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="skilllink-screen skilllink-chat h-dvh flex flex-col max-w-4xl mx-auto border-x border-gray-200">

            {/* ==============================================
                1. HEADER with BACK BUTTON
               ============================================== */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href={backUrl} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </Link>

                    <div>
                        <h2 className="text-sm font-bold text-gray-900 leading-tight">SkillLink / Job #{booking.id}</h2>
                        <p className="text-xs text-gray-500">{booking.service_type}</p>
                    </div>
                </div>

                {/* User Badge */}
                <div className="text-xs font-medium bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                    {currentUser.name}
                </div>
            </div>

            {/* ==============================================
                2. MESSAGE AREA
               ============================================== */}
            <div ref={messageListRef} onScroll={event => {
                const list = event.currentTarget;
                nearBottomRef.current = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
            }} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-gray-400 text-sm">This is the start of your conversation.</p>
                    </div>
                )}

                {messages.map((msg, index) => {
                    // Check ID match carefully
                    const myId = currentUser.id || currentUser.user_id;
                    const isMe = msg.sender_id == myId;

                    return (
                        <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm text-sm ${
                                isMe
                                    ? 'bg-[#0965e8] text-white rounded-br-none'
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                            }`}>
                                {!isMe && msg.sender && (
                                    <p className="text-[10px] font-bold text-gray-400 mb-1">{msg.sender.name}</p>
                                )}
                                <p className="leading-relaxed break-words">{msg.content}</p>
                                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ==============================================
                3. INPUT AREA
               ============================================== */}
            <div className="bg-white border-t border-gray-200 p-3 pb-safe">
                <form onSubmit={submit} className="flex gap-2 items-center">
                    <input
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="flex-1 min-w-0 p-3 bg-gray-100 border-0 rounded-full focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                        placeholder="Type a message..."
                        disabled={sending}
                    />
                    <button
                        aria-label="Send message" type="submit"
                        disabled={sending || !draft.trim()}
                        className="bg-[#0965e8] text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-transform active:scale-95"
                    >
                        <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </form>
                {sendError && <p role="alert" className="mt-2 text-xs text-red-600">{sendError}</p>}
                {sendSuccess && <p role="status" className="mt-2 text-xs text-green-700">{sendSuccess}</p>}
            </div>
        </div>
    );
}
