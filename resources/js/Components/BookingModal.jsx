import React, { useState } from 'react';

const BookingModal = ({ repairer, onClose, onConfirm }) => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [issue, setIssue] = useState('');

    if (!repairer) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        // Pass the booking details back to the parent
        onConfirm({ ...repairer, date, time, issue });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                
                {/* Header with Repairer Info */}
                <div className="bg-blue-600 p-6 text-white">
                    <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold">Book Appointment</h2>
                        <button onClick={onClose} className="text-white/80 hover:text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
                            {repairer.name.charAt(0)}
                        </div>
                        <div>
                            <p className="font-semibold text-lg">{repairer.name}</p>
                            <p className="text-blue-100 text-sm flex items-center">
                                <span className="text-yellow-300 mr-1">★ {repairer.rating}</span> 
                                • {repairer.status}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Booking Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    
                    {/* Date & Time Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input 
                                type="date" 
                                required
                                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                            <input 
                                type="time" 
                                required
                                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Issue Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">What's the problem?</label>
                        <textarea 
                            rows="3"
                            placeholder="Briefly describe the repair needed..."
                            className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            value={issue}
                            onChange={(e) => setIssue(e.target.value)}
                        ></textarea>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex gap-3">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg transition transform active:scale-95"
                        >
                            Confirm Booking
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookingModal;