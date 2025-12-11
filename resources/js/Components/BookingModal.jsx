import React, { useState } from 'react';

export default function BookingModal({ repairer, onClose, onConfirm }) {
    // 1. STATE for the inputs
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState(''); // <--- MAKE SURE THIS EXISTS

    if (!repairer) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        // 2. PASS 'notes' TO THE PARENT
        onConfirm({ 
            date, 
            time, 
            notes // <--- THIS WAS LIKELY MISSING OR NAMED WRONG
        });
        
        // Reset form
        setNotes('');
        setDate('');
        setTime('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                
                {/* Header */}
                <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                    <h2 className="text-lg font-bold">Book {repairer.name}</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    
                    {/* Date & Time Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input 
                                type="date" 
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                            <input 
                                type="time" 
                                required
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* 3. THE PROBLEM DESCRIPTION INPUT */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">What's the problem?</label>
                        <textarea 
                            rows="3"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)} // <--- CRITICAL: Updates the state
                            placeholder="e.g. My sink is leaking..."
                            className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        ></textarea>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200"
                        >
                            Confirm Booking
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}