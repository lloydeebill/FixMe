import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import RepairerFormFields from '@/Components/RepairerFormFields'; // <--- IMPORT IT

export default function RepairerRegister() {
    const { auth } = usePage().props;
    
    const { data, setData, post, processing, errors } = useForm({
        business_name: '',
        focus_area: '', 
        bio: '',
    });

    const submit = (e) => {
        e.preventDefault();
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
                            <p className="text-gray-500 mt-2">Fill out your professional details below.</p>
                        </div>

                        <form onSubmit={submit}>
                            
                            {/* --- REUSABLE COMPONENT --- */}
                            <RepairerFormFields 
                                data={data} 
                                setData={setData} 
                                errors={errors} 
                            />
                            {/* -------------------------- */}

                            <div className="pt-6">
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