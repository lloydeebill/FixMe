import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';

// You can use your existing components if you want, or just raw HTML for simplicity.
// I'll use raw Tailwind here to guarantee it works without missing imports.

export default function RepairerRegister({ auth }) {
    const { data, setData, post, processing, errors } = useForm({
        business_name: '',
        focus_area: 'Repairer', // Default value
        bio: '',
        address_text: '',
        latitude: null,
        longitude: null,
    });

    const [locationStatus, setLocationStatus] = useState('idle'); // idle | loading | success

    const submit = (e) => {
        e.preventDefault();
        
        // 🛑 FIX: Use the string URL directly to ensure it hits the route
        post('/become-repairer', {
            onSuccess: () => alert('Welcome to the team!'),
            onError: (err) => console.log(err), // Helpful for debugging
        });
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }
        setLocationStatus('loading');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Update Form Data
                setData(previousData => ({
                    ...previousData,
                    latitude: lat,
                    longitude: lng
                }));

                // Optional: Auto-fill address text using Free Nominatim API
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                    .then(res => res.json())
                    .then(data => {
                        setData(previousData => ({
                            ...previousData,
                            address_text: data.display_name // Auto-fill the text box
                        }));
                        setLocationStatus('success');
                    });
            },
            (error) => {
                setLocationStatus('error');
                alert("Could not get location. Please type address manually.");
            }
        );
    };

    return (
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gray-100">
            <Head title="Become a Repairer" />

            {/* Logo or Branding */}
            <div className="mb-6 text-center">
                <h1 className="text-3xl font-black text-blue-600 tracking-tighter">FixMe.</h1>
                <p className="text-gray-500 text-sm mt-2">Join our network of professional fixers</p>
            </div>

            <div className="w-full sm:max-w-md mt-6 px-6 py-8 bg-white shadow-md overflow-hidden sm:rounded-lg">
                <form onSubmit={submit}>
                    
                    {/* 1. Business Name */}
                    <div className="mb-4">
                        <label className="block font-medium text-sm text-gray-700" htmlFor="business_name">
                            Business / Display Name
                        </label>
                        <input
                            id="business_name"
                            type="text"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm mt-1 block w-full"
                            value={data.business_name}
                            onChange={(e) => setData('business_name', e.target.value)}
                            required
                            placeholder="e.g. John's Plumbing"
                        />
                        {errors.business_name && <div className="text-red-500 text-xs mt-1">{errors.business_name}</div>}
                    </div>

                    {/* 2. Focus Area (Dropdown) */}
                    <div className="mb-4">
                        <label className="block font-medium text-sm text-gray-700" htmlFor="focus_area">
                            Specialty
                        </label>
                        <select
                            id="focus_area"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm mt-1 block w-full"
                            value={data.focus_area}
                            onChange={(e) => setData('focus_area', e.target.value)}
                        >
                            <option value="Repairer">General Repairer</option>
                            <option value="Plumbing">Plumbing</option>
                            <option value="Electrical">Electrical</option>
                            <option value="Cleaning">Cleaning</option>
                        </select>
                        {errors.focus_area && <div className="text-red-500 text-xs mt-1">{errors.focus_area}</div>}
                    </div>

                    {/* 3. Bio */}
                    <div className="mb-6">
                        <label className="block font-medium text-sm text-gray-700" htmlFor="bio">
                            Short Bio
                        </label>
                        <textarea
                            id="bio"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm mt-1 block w-full"
                            rows="4"
                            value={data.bio}
                            onChange={(e) => setData('bio', e.target.value)}
                            placeholder="Tell customers about your experience..."
                        ></textarea>
                        {errors.bio && <div className="text-red-500 text-xs mt-1">{errors.bio}</div>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4">
                        <Link
                            href="/app"
                            className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={processing}
                            className={`inline-flex items-center px-4 py-3 bg-black border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:bg-gray-700 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150 ${
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