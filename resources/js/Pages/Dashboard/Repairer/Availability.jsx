import React from 'react';
import { useForm, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'; // Assuming you use the default layout
import PrimaryButton from '@/Components/PrimaryButton';

const DAYS_OF_WEEK = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export default function Availability({ auth, schedule }) {
    // Initialize the form with the schedule passed from the Controller
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        schedule: schedule || []
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Sends a PUT request to the route we defined in web.php
        put(route('availability.update'), {
            preserveScroll: true,
        });
    };

    // Helper to update a specific day's field (e.g., changing Monday's start_time)
    const updateDay = (index, field, value) => {
        const newSchedule = [...data.schedule];
        newSchedule[index][field] = value;
        setData('schedule', newSchedule);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Manage Availability</h2>}
        >
            <Head title="My Schedule" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        
                        <header className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900">Weekly Schedule</h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Set your standard working hours. Uncheck days you are off.
                            </p>
                        </header>

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                {data.schedule.map((day, index) => (
                                    <div 
                                        key={day.day_of_week} 
                                        className={`flex items-center justify-between p-4 rounded-lg border ${day.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}`}
                                    >
                                        {/* Left: Checkbox & Day Name */}
                                        <div className="flex items-center space-x-4 w-1/3">
                                            <input
                                                type="checkbox"
                                                checked={day.is_active}
                                                onChange={(e) => updateDay(index, 'is_active', e.target.checked)}
                                                className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                            />
                                            <span className={`font-medium ${day.is_active ? 'text-gray-900' : 'text-gray-400'}`}>
                                                {DAYS_OF_WEEK[day.day_of_week]}
                                            </span>
                                        </div>

                                        {/* Right: Time Inputs (Only show if Active) */}
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="time"
                                                value={day.start_time}
                                                disabled={!day.is_active}
                                                onChange={(e) => updateDay(index, 'start_time', e.target.value)}
                                                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm disabled:bg-gray-100 disabled:text-gray-400"
                                            />
                                            <span className="text-gray-500">-</span>
                                            <input
                                                type="time"
                                                value={day.end_time}
                                                disabled={!day.is_active}
                                                onChange={(e) => updateDay(index, 'end_time', e.target.value)}
                                                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm disabled:bg-gray-100 disabled:text-gray-400"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Success Message */}
                            {recentlySuccessful && (
                                <div className="mt-4 text-sm text-green-600">
                                    Schedule saved successfully!
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="mt-6 flex justify-end">
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Saving...' : 'Save Schedule'}
                                </PrimaryButton>
                            </div>
                        </form>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}