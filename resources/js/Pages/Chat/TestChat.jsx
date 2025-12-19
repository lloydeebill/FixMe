import React, { useState, useEffect, useRef } from 'react';
import { useForm, Link } from '@inertiajs/react'; //  Import Link

export default function TestChat({ booking, currentUser, initialMessages }) {
    const [messages, setMessages] = useState(initialMessages);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages]);

    const { data, setData, post, reset, processing } = useForm({
        message: '',
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const myUserId = currentUser.id || currentUser.user_id;
        window.Echo.private(`messages.${myUserId}`)
            .listen('.message.sent', (e) => {
                setMessages((prev) => [...prev, e.message]);
            });

        return () => {
            window.Echo.leave(`messages.${myUserId}`);
        };
    }, [currentUser.id, currentUser.user_id]);

    const submit = (e) => {
        e.preventDefault();
        if (!data.message.trim()) return;

        post(`/api/messages/${booking.id}`, {
            onSuccess: () => {
                reset('message');
            },
            preserveScroll: true,
        });
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            
            {/* ==============================================
                1. HEADER with BACK BUTTON
               ============================================== */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href="/app" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </Link>
                    
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 leading-tight">Job #{booking.id}</h2>
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
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
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
                                    ? 'bg-blue-600 text-white rounded-br-none' 
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                            }`}>
                                {!isMe && msg.sender && (
                                    <p className="text-[10px] font-bold text-gray-400 mb-1">{msg.sender.name}</p>
                                )}
                                <p className="leading-relaxed">{msg.content}</p>
                                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* ==============================================
                3. INPUT AREA
               ============================================== */}
            <div className="bg-white border-t border-gray-200 p-3 pb-safe">
                <form onSubmit={submit} className="flex gap-2 items-center">
                    <input 
                        type="text" 
                        value={data.message}
                        onChange={(e) => setData('message', e.target.value)}
                        className="flex-1 p-3 bg-gray-100 border-0 rounded-full focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                        placeholder="Type a message..."
                        disabled={processing}
                    />
                    <button 
                        type="submit" 
                        disabled={processing || !data.message.trim()}
                        className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-transform active:scale-95"
                    >
                        <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </form>
            </div>
        </div>
    );
}