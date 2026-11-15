import '../skilllink.css';
import React from 'react';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import RepairerFormFields from '@/Components/RepairerFormFields';
import LocationPicker from '@/Components/LocationPicker';
import { FiArrowLeft } from 'react-icons/fi';

export default function RepairerRegister({ auth, availableSkills }) {
    const { pilotAreas = {} } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        // Matches the same structure as Onboarding
        business_name: '',
        skills: [],
        service_areas: [],
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
        <div className="skilllink-screen min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gray-100 font-sans">
            <Head title="Offer Services" />

            <header className="-mt-6 flex min-h-14 w-full items-center gap-2 bg-white px-4 py-3 sm:hidden"><Link href="/app?tab=settings&mode=client" aria-label="Back to Settings" className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-[#0965e8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0965e8]"><FiArrowLeft aria-hidden="true" /></Link><h1 className="min-w-0 text-xl font-semibold text-[#172335]">Offer Services</h1></header>
            <div className="mb-6 text-center">
                <h1 className="hidden text-xl font-semibold text-[#172335] sm:block sm:text-3xl sm:text-[#0965e8]">Offer Services</h1>
                <p className="mt-2 text-sm text-gray-500">Set up your provider profile and choose your services.</p>
            </div>

            <div className="w-full sm:max-w-lg mt-6 px-6 py-8 bg-white shadow-sm overflow-hidden sm:rounded-lg">
                <form onSubmit={submit} className="space-y-5">

                    <RepairerFormFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        availableSkills={availableSkills} //
                        pilotAreas={pilotAreas}
                    />

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
                    <div className="flex items-center justify-end gap-4 mt-6 pt-4 border-t border-gray-100">
                        <Link href="/app" className="hidden text-sm text-gray-600 hover:text-gray-900 sm:inline">Cancel</Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className={`inline-flex items-center px-4 py-3 bg-[#0965e8] border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-[#0753be] active:bg-gray-900 transition ease-in-out duration-150 ${
                                processing ? 'opacity-25' : ''
                            }`}
                        >
                            {processing ? 'Registering...' : 'Create Provider Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
