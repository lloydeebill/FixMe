import React, { useState, useMemo } from 'react';

export default function BookingModal({ repairer, onClose, onConfirm }) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    // Access the schedule from the profile
    const availabilities = repairer?.repairer_profile?.availabilities || [];

    // --- LOGIC: CHECK IF DATE IS VALID ---
    const handleDateChange = (e) => {
        const selectedDate = e.target.value;
        setError('');
        setTime('');

        if (!selectedDate) {
            setDate('');
            return;
        }

        // 🛑 NEW: Convert selected date to 0-6 index (0=Sunday, 6=Saturday)
        // This matches your new Database logic!
        const dateObj = new Date(selectedDate);
        const dayIndex = dateObj.getDay(); // Returns 0, 1, 2... 6

        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

        // Find the rule using the INTEGER index, not the string name
        const dayRule = availabilities.find(a => parseInt(a.day_of_week) === dayIndex);

        // Check availability
        // If no rule exists, we assume CLOSED (Whitelist logic)
        if (!dayRule || !dayRule.is_active) {
            setError(`Repairer is not available on ${dayName}s.`);
            setDate(selectedDate);
            return; 
        }

        setDate(selectedDate);
    };

    // --- LOGIC: GENERATE TIME SLOTS ---
    const availableSlots = useMemo(() => {
        if (!date || error) return [];

        const dayIndex = new Date(date).getDay();
        const dayRule = availabilities.find(a => parseInt(a.day_of_week) === dayIndex);

        if (!dayRule || !dayRule.is_active) return [];

        // Parse "09:00:00" -> 9
        const startHour = parseInt(dayRule.start_time.split(':')[0], 10);
        const endHour = parseInt(dayRule.end_time.split(':')[0], 10);
        
        const slots = [];
        for (let h = startHour; h < endHour; h++) {
            const hourString = h.toString().padStart(2, '0') + ':00';
            slots.push(hourString);
        }

        return slots;
    }, [date, availabilities, error]);

    // Helper: 13:00 -> 1:00 PM
    const formatTime = (time24) => {
        const [hour, minute] = time24.split(':');
        const h = parseInt(hour, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12; 
        return `${h12}:${minute} ${ampm}`;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (error) return;
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
                    
                    {/* Date Picker */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Date</label>
                        <input 
                            type="date" 
                            required
                            min={new Date().toISOString().split('T')[0]}
                            className={`w-full rounded-xl font-medium border-2 ${error ? 'border-red-500 text-red-600' : 'border-gray-200 focus:border-black'}`}
                            value={date}
                            onChange={handleDateChange}
                        />
                        {error && <p className="text-red-500 text-xs mt-2 font-bold">{error}</p>}
                    </div>

                    {/* Time Slots */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Available Times</label>
                        {!date ? (
                            <p className="text-sm text-gray-400 italic">Please select a date first.</p>
                        ) : availableSlots.length === 0 ? (
                            <p className="text-sm text-red-500 italic">No available slots for this day.</p>
                        ) : (
                            <div className="grid grid-cols-4 gap-2">
                                {availableSlots.map(slot => (
                                    <button
                                        key={slot}
                                        type="button"
                                        onClick={() => setTime(slot)}
                                        className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                                            time === slot 
                                            ? 'bg-black text-white border-black transform scale-105' 
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                                        }`}
                                    >
                                        {formatTime(slot)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Problem Description</label>
                        <textarea 
                            className="w-full rounded-xl border-gray-200 focus:border-black focus:ring-black text-sm"
                            rows="3"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Describe the issue..."
                        ></textarea>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={!date || !time || !!error} 
                            className="flex-1 py-3 bg-black text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Send Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}