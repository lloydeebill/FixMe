import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import RepairerFormFields from '@/Components/RepairerFormFields'; 
import LocationPicker from '@/Components/LocationPicker';       

// 🛑 FIX: Accept 'availableSkills' from the Controller
export default function RepairerRegister({ auth, availableSkills }) {
    const { data, setData, post, processing, errors } = useForm({
        // Matches the same structure as Onboarding
        business_name: '',
        skills: [],
        bio: '',
        location: '', // Address text
        latitude: null,
        longitude: null,
    });

    // --- REUSED HANDLER (Same as Onboarding) ---
    const handleLocationChange = (locData) => {
        setData(prev => ({
            ...prev,
            latitude: locData.lat,
            longitude: locData.lng,
            location: locData.address 
        }));
    };

    const submit = (e) => {
        e.preventDefault();
        
        // Validation
        if (!data.latitude) {
            alert("Please pin your business location on the map.");
            return;
        }

        if (data.skills.length === 0) {
            alert("Please select at least one skill.");
            return;
        }

        post('/become-repairer', {
            onSuccess: () => {
                // The backend controller now redirects to dashboard with success message
                // so we generally don't need a manual alert here, but it doesn't hurt.
            },
            onError: (err) => console.log(err),
        });
    };

    return (
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gray-100 font-sans">
            <Head title="Become a Repairer" />

            <div className="mb-6 text-center">
                <h1 className="text-3xl font-black text-blue-600 tracking-tighter">FixMe.</h1>
                <p className="text-gray-500 text-sm mt-2">Join our network of professional fixers</p>
            </div>

            <div className="w-full sm:max-w-lg mt-6 px-6 py-8 bg-white shadow-md overflow-hidden sm:rounded-lg">
                <form onSubmit={submit} className="space-y-5">
                    
                    {/* 👇 1. REUSED FORM FIELDS (Business Name, Bio, Skills) */}
                    <RepairerFormFields 
                        data={data}
                        setData={setData}
                        errors={errors}
                        availableSkills={availableSkills} // 👈 Now this has data!
                    />

                    {/* 👇 2. REUSED LOCATION PICKER */}
                    <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Business Location</label>
                        <LocationPicker 
                            initialLat={data.latitude}
                            initialLng={data.longitude}
                            onLocationChange={handleLocationChange}
                        />
                        {/* Read-Only Address Input */}
                        <input
                            type="text"
                            value={data.location}
                            readOnly
                            className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm bg-gray-100 text-gray-600 text-xs"
                            placeholder="Address will appear here..."
                        />
                        {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                        <Link
                            href="/app"
                            className="underline text-sm text-gray-600 hover:text-gray-900"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={processing}
                            className={`inline-flex items-center px-4 py-3 bg-black border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 transition ease-in-out duration-150 ${
                                processing ? 'opacity-25' : ''
                            }`}
                        >
                            {processing ? 'Registering...' : 'Activate Pro Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}