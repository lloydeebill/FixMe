import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { usePage } from '@inertiajs/react';

export default function AuthSwitch({ defaultView = 'login' }) {
    // State controls which form is currently visible
    const [view, setView] = useState(defaultView);
    const { errors } = usePage().props;

    // If Laravel sends back validation errors, automatically switch to the erroring form.
    useState(() => {
        if (errors.name || errors.password_confirmation) {
            setView('register');
        }
    }, [errors]);

    const handleSwitch = (newView) => (e) => {
        e.preventDefault();
        setView(newView);
    };

    return (
        <div className="w-full">
            {/* Nav Links for Switching Forms */}
            <div className="flex justify-center space-x-4 mb-4 border-b border-gray-200">
                <button
                    onClick={() => setView('login')}
                    className={`pb-2 font-semibold transition ${view === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Sign In
                </button>
                <button
                    onClick={() => setView('register')}
                    className={`pb-2 font-semibold transition ${view === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Sign Up
                </button>
            </div>

            {/* Render the selected form */}
            {view === 'login' && <LoginForm />}
            {view === 'register' && <RegisterForm />}

            {/* Optional: Add a back button if needed, or rely on internal form links */}
        </div>
    );
}