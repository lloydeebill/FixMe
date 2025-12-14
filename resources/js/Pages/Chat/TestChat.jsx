import React, { useState, useEffect, useRef } from 'react';
import { useForm } from '@inertiajs/react';

export default function TestChat({ booking, currentUser, initialMessages }) {
    // 1. Initialize state with the messages passed from Laravel
    const [messages, setMessages] = useState(initialMessages);
    const messagesEndRef = useRef(null);

    useEffect(() => {
    setMessages(initialMessages);
    }, [initialMessages]);
    // 2. Setup the Inertia Form
    const { data, setData, post, reset, processing } = useForm({
        message: '',
    });

    // 3. Scroll to bottom whenever messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Run scroll on load and when messages update
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 4. LISTEN FOR EVENTS (The Real-Time Part)
    useEffect(() => {
        console.log(`Attempting to connect to channel: messages.${currentUser.id}`);

        const myUserId = currentUser.id || currentUser.user_id;
        window.Echo.private(`messages.${myUserId}`)
            .listen('.message.sent', (e) => {
                console.log('Real-time message received:', e.message);
                
                // Only push to state if the message belongs to THIS conversation
                // (This prevents messages from other bookings appearing here if you have multiple jobs)
                // Since we don't have conversation ID in the event easily, we just push it for this test.
                setMessages((prev) => [...prev, e.message]);
            });

        // Cleanup: Disconnect when leaving the page
        return () => {
            window.Echo.leave(`messages.${currentUser.id}`);
        };
    }, [currentUser.id]);

    // 5. Send Message Handler
    const submit = (e) => {
        e.preventDefault();
        
        if (!data.message.trim()) return;

        // Use Inertia's post method to send data to backend
        post(`/api/messages/${booking.id}`, {
            onSuccess: () => {
                reset('message');
                // Note: We don't manually add the message here. 
                // We wait for the Websocket to "echo" it back to us.
                // This proves the real-time connection works!
            },
            preserveScroll: true,
        });
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
            <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg overflow-hidden">
                {/* Header */}
                <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                    <h2 className="text-xl font-bold">Chat: Job #{booking.id}</h2>
                    <span className="text-sm bg-blue-700 px-2 py-1 rounded">
                        Logged in as: {currentUser.name}
                    </span>
                </div>
                
                {/* Message Area */}
                <div className="h-96 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
                    {messages.length === 0 && (
                        <p className="text-gray-400 text-center mt-10">No messages yet. Say hi!</p>
                    )}
                    
                    {messages.map((msg, index) => {
                    const isMe = msg.sender_id === (currentUser.id || currentUser.user_id);                        return (
                            <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs px-4 py-2 rounded-lg shadow-sm ${
                                    isMe 
                                        ? 'bg-blue-500 text-white rounded-br-none' 
                                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                }`}>
                                    {/* Sender Name (Only show if not me) */}
                                    {!isMe && msg.sender && (
                                        <div className="text-xs font-bold text-gray-500 mb-1">
                                            {msg.sender.name}
                                        </div>
                                    )}
                                    <p>{msg.content}</p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-200">
                    <form onSubmit={submit} className="flex gap-2">
                        <input 
                            type="text" 
                            value={data.message}
                            onChange={(e) => setData('message', e.target.value)}
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Type a message..."
                            disabled={processing}
                        />
                        <button 
                            type="submit" 
                            disabled={processing || !data.message.trim()}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}