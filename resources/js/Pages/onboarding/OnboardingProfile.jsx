import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import RepairerFormFields from '@/Components/RepairerFormFields';
import LocationPicker from '@/Components/LocationPicker'; // 👈 IMPORT THE MAP PICKER

export default function OnboardingProfile({ auth }) {
    const [step, setStep] = useState(1);
    
    const { data, setData, post, processing, errors } = useForm({
        // Basics
        name: auth.user.name || '',
        gender: '',
        location: '', 
        latitude: null, 
        longitude: null,
        date_of_birth: '',
        
        // Logic
        is_repairer: false,

        // Repairer Specifics
        business_name: '',
        focus_area: '',
        bio: '',
    });

    // --- HANDLERS ---

    // 1. NEW: Handle updates from the Map Picker
    const handleLocationChange = (locData) => {
        setData(prev => ({
            ...prev,
            latitude: locData.lat,
            longitude: locData.lng,
            location: locData.address // Auto-fill text address from the pin
        }));
    };

    const selectRole = (role) => {
        setData('is_repairer', role === 'repairer');
        setStep(2);
    };

    const handleStep2Submit = (e) => {
        e.preventDefault();

        // Validation: Ensure they actually have a location
        if (!data.latitude) {
            alert("Please wait for the map to locate you, or drag the pin to your location.");
            return;
        }

        if (data.is_repairer) {
            setStep(3);
        } else {
            post('/onboarding/complete');
        }
    };

    const handleFinalSubmit = (e) => {
        e.preventDefault();
        post('/onboarding/complete');
    };

    const goBack = () => {
        setStep(step - 1);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 font-sans">
            <Head title="Welcome to FixMe" />

            {/* PROGRESS INDICATOR */}
            <div className="mb-8 flex items-center space-x-2 text-sm font-medium text-gray-400">
                <span className={step >= 1 ? "text-blue-600" : ""}>Role</span>
                <span>&rarr;</span>
                <span className={step >= 2 ? "text-blue-600" : ""}>Personal</span>
                {data.is_repairer && (
                    <>
                        <span>&rarr;</span>
                        <span className={step === 3 ? "text-blue-600" : ""}>Business</span>
                    </>
                )}
            </div>

            <div className="max-w-3xl w-full">
                
                {/* STEP 1: ROLE SELECTION */}
                {step === 1 && (
                    <div className="space-y-8 text-center animate-fade-in-up">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900">How do you want to use FixMe?</h1>
                            <p className="mt-2 text-gray-500">Choose your primary goal to get started.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            <button onClick={() => selectRole('customer')} className="group relative flex flex-col items-center p-8 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-xl transition-all duration-300">
                                <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600">Find a Service</h3>
                            </button>

                            <button onClick={() => selectRole('repairer')} className="group relative flex flex-col items-center p-8 bg-white border-2 border-gray-200 rounded-2xl hover:border-green-500 hover:shadow-xl transition-all duration-300">
                                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600">Offer Services</h3>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: BASIC INFO */}
                {step === 2 && (
                    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 animate-fade-in-right max-w-lg mx-auto">
                        <div className="mb-6">
                            <button onClick={goBack} className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center">
                                &larr; Back to Role Selection
                            </button>
                            <h2 className="text-2xl font-bold text-gray-900">Tell us about yourself</h2>
                        </div>

                        <form onSubmit={handleStep2Submit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                <input
                                    type="date"
                                    value={data.date_of_birth}
                                    onChange={(e) => setData('date_of_birth', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                                {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                                    <select
                                        value={data.gender}
                                        onChange={(e) => setData('gender', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="" disabled>Select...</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                                </div>

                               
                            </div>

                             {/* 👇 THE NEW MAP PICKER IMPLEMENTATION 👇 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    
                                    {/* 1. MAP PICKER COMPONENT */}
                                    <LocationPicker 
                                        initialLat={data.latitude}
                                        initialLng={data.longitude}
                                        onLocationChange={handleLocationChange}
                                    />
                                    
                                    {/* 2. READ-ONLY ADDRESS DISPLAY */}
                                    <input
                                        type="text"
                                        value={data.location}
                                        readOnly // User changes this by dragging the pin, not typing
                                        className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm bg-gray-100 text-gray-600 text-xs"
                                        placeholder="Location address will appear here..."
                                    />
                                    
                                    {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                                </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={`w-full py-3 px-4 text-white font-bold rounded-lg shadow-md transition-transform transform active:scale-95 disabled:opacity-50 ${data.is_repairer ? 'bg-gray-800 hover:bg-gray-900' : 'bg-blue-600 hover:bg-blue-700'}`}
                                >
                                    {data.is_repairer ? 'Next' : 'Finish Setup'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* STEP 3: BUSINESS INFO */}
                {step === 3 && data.is_repairer && (
                    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 animate-fade-in-right max-w-lg mx-auto">
                        <div className="mb-6">
                            <button onClick={goBack} className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center">
                                &larr; Back to Personal Details
                            </button>
                            <h2 className="text-2xl font-bold text-gray-900">Business Profile</h2>
                        </div>

                        <form onSubmit={handleFinalSubmit} className="space-y-5">
                            <RepairerFormFields 
                                data={data} 
                                setData={setData} 
                                errors={errors} 
                            />

                            <div className="pt-4">
                                <button type="submit" className="w-full py-3 bg-black text-white font-bold rounded-lg">
                                    Complete Registration
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}