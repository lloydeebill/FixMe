import React, { useState } from 'react';

export default function BookingModal({ repairer, onClose, onConfirm }) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');

    // 1. DATA: Keep values in 24-hour format for the Database
    const morningSlots = ["08:00", "09:00", "10:00", "11:00"];
    const afternoonSlots = ["13:00", "14:00", "15:00", "16:00", "17:00"];

    // 2. HELPER: Converts "13:00" -> "1:00 PM" for Display Only
    const formatTime = (time24) => {
        const [hour, minute] = time24.split(':');
        const h = parseInt(hour, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12; 
        return `${h12}:${minute} ${ampm}`;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm({ date, time, notes });
    };

    if (!repairer) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
                
                <div className="bg-black p-6 text-white text-center">
                    <h3 className="text-xl font-bold">Request Service</h3>
                    <p className="text-gray-400 text-sm">with {repairer.name}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    
                    {/* Date Picker (Keep existing) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Date</label>
                        <input 
                            type="date" 
                            required
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full rounded-xl border-gray-200 focus:border-black focus:ring-black font-medium"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    {/* Time Slots */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Morning</label>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {morningSlots.map(slot => (
                                <button
                                    key={slot}
                                    type="button"
                                    onClick={() => setTime(slot)}
                                    // Visual logic to highlight selected button
                                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                                        time === slot 
                                        ? 'bg-black text-white border-black' 
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                    }`}
                                >
                                    {/* DISPLAY the formatted time (e.g. 9:00 AM) */}
                                    {formatTime(slot)}
                                </button>
                            ))}
                        </div>

                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Afternoon</label>
                        <div className="grid grid-cols-5 gap-2">
                            {afternoonSlots.map(slot => (
                                <button
                                    key={slot}
                                    type="button"
                                    onClick={() => setTime(slot)}
                                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                                        time === slot 
                                        ? 'bg-black text-white border-black' 
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                    }`}
                                >
                                    {/* DISPLAY the formatted time (e.g. 2:00 PM) */}
                                    {formatTime(slot)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes & Submit (Keep existing) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</label>
                        <textarea 
                            className="w-full rounded-xl border-gray-200 focus:border-black focus:ring-black text-sm"
                            rows="3"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl">Cancel</button>
                        <button type="submit" disabled={!date || !time} className="flex-1 py-3 bg-black text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 disabled:opacity-50">Send Request</button>
                    </div>
                </form>
            </div>
        </div>
    );
}