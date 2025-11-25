import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function RepairerRegister() {
    const { auth } = usePage().props;
    
    // Setup the form helper
    const { data, setData, post, processing, errors } = useForm({
        business_name: '',
        focus_area: '', // We can make this a dropdown later
        bio: '',
    });

    const submit = (e) => {
        e.preventDefault();
        // This posts to the 'store' method in your RepairerController
        post('/repairer/apply');    
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Become a Pro</h2>}
        >
            <Head title="Register as Repairer" />

            <div className="py-12">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                        
                        <div className="mb-6 text-center">
                            <h1 className="text-2xl font-bold text-gray-900">Join the FixMe Team</h1>
                            <p className="text-gray-500 mt-2">Fill out your professional details below to start receiving jobs.</p>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            
                            {/* Business Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name / Display Name</label>
                                <input
                                    type="text"
                                    value={data.business_name}
                                    onChange={(e) => setData('business_name', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="e.g. Manny's Electric or Manuel Reyes"
                                />
                                {errors.business_name && <p className="text-red-500 text-xs mt-1">{errors.business_name}</p>}
                            </div>

                            {/* Focus Area */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Main Skill (Focus Area)</label>
                                <select
                                    value={data.focus_area}
                                    onChange={(e) => setData('focus_area', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="" disabled>Select your expertise...</option>
                                    <option value="Electrical">Electrical</option>
                                    <option value="Plumbing">Plumbing</option>
                                    <option value="Carpentry">Carpentry</option>
                                    <option value="Appliances">Appliances</option>
                                    <option value="Cleaning">Cleaning</option>
                                </select>
                                {errors.focus_area && <p className="text-red-500 text-xs mt-1">{errors.focus_area}</p>}
                            </div>

                            {/* Bio */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Short Bio</label>
                                <textarea
                                    value={data.bio}
                                    onChange={(e) => setData('bio', e.target.value)}
                                    rows="4"
                                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Tell customers about your experience, certifications, or guarantees..."
                                ></textarea>
                                {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio}</p>}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition transform active:scale-95 disabled:opacity-50"
                                >
                                    {processing ? 'Registering...' : 'Activate Repairer Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}