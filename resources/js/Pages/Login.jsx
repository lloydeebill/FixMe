import React from 'react';
import { usePage } from '@inertiajs/react';
import AuthSwitch from '../Components/AuthSwitch';
import GuestLayout from '../Layouts/GuestLayout';
export default function Login() {
    const { flash } = usePage().props;
    return <GuestLayout title="Sign in">
        {flash?.message && <div role="status" className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{flash.message}</div>}
        <AuthSwitch />
    </GuestLayout>;
}
