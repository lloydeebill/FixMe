import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';

export default function ScheduleView({ existingSchedule, onSaveSuccess }) {
    
    // 1. DAYS CONSTANT (Matches your DB 0-6 logic)
    const DAYS = [
        { id: 1, label: 'Monday' },
        { id: 2, label: 'Tuesday' },
        { id: 3, label: 'Wednesday' },
        { id: 4, label: 'Thursday' },
        { id: 5, label: 'Friday' },
        { id: 6, label: 'Saturday' },
        { id: 0, label: 'Sunday' }, // 0 is usually Sunday in JS/DB
    ];

    // 2. HELPER: Build initial state from DB or Default
    const buildInitialState = () => {
        // Create a map of existing rules for fast lookup
        const scheduleMap = {};
        if (existingSchedule) {
            existingSchedule.forEach(item => {
                scheduleMap[item.day_of_week] = item;
            });
        }

        // Return array of 7 days with their settings
        return DAYS.map(day => {
            const existing = scheduleMap[day.id];
            return {
                day_of_week: day.id,
                is_active: existing ? Boolean(existing.is_active) : false, // Default to OFF if new
                start_time: existing?.start_time || '09:00',
                end_time: existing?.end_time || '17:00',
            };
        });
    };

    // 3. FORM HANDLING
    const { data, setData, post, processing } = useForm({
        schedule: buildInitialState()
    });

    const handleToggleDay = (index) => {
        const newSchedule = [...data.schedule];
        newSchedule[index].is_active = !newSchedule[index].is_active;
        setData('schedule', newSchedule);
    };

    const handleTimeChange = (index, field, value) => {
        const newSchedule = [...data.schedule];
        newSchedule[index][field] = value;
        setData('schedule', newSchedule);
    };

    const submit = (e) => {
        e.preventDefault();
        post('/repairer/availability', { // Ensure this route exists in web.php
            preserveScroll: true,
            onSuccess: () => {
                // 👇 THIS TRIGGERS THE TAB SWITCH IN THE PARENT
                if (onSaveSuccess) onSaveSuccess(); 
            }
        });
    };

    return (
        <form onSubmit={submit} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            
            {/* Header Message for New Users */}
            {(!existingSchedule || existingSchedule.length === 0) && (
                <div className="bg-blue-50 p-4 border-b border-blue-100">
                    <p className="text-blue-800 text-sm font-bold">
                        👋 Let's set up your work hours so customers can book you.
                    </p>
                </div>
            )}

            <div className="divide-y divide-gray-100">
                {data.schedule.map((day, index) => {
                    // Find label for display
                    const dayLabel = DAYS.find(d => d.id === day.day_of_week)?.label;

                    return (
                        <div key={day.day_of_week} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            
                            {/* Toggle Switch */}
                            <div className="flex items-center gap-4 w-1/3">
                                <button 
                                    type="button"
                                    onClick={() => handleToggleDay(index)}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${day.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${day.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                                <span className={`font-bold ${day.is_active ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {dayLabel}
                                </span>
                            </div>

                            {/* Time Inputs (Only show if Active) */}
                            {day.is_active ? (
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="time" 
                                        value={day.start_time}
                                        onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                                        className="border-gray-200 rounded-lg text-sm font-medium focus:ring-black focus:border-black"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input 
                                        type="time" 
                                        value={day.end_time}
                                        onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                                        className="border-gray-200 rounded-lg text-sm font-medium focus:ring-black focus:border-black"
                                    />
                                </div>
                            ) : (
                                <div className="text-sm text-gray-400 italic pr-12">Unavailable</div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100">
                <button 
                    type="submit" 
                    disabled={processing}
                    className="w-full bg-black text-white font-bold py-4 rounded-xl shadow-lg hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                    {processing ? 'Saving...' : 'Save Schedule & Go to Jobs →'}
                </button>
            </div>
        </form>
    );
}