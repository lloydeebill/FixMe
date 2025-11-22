
import React from "react";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Link, useForm } from "@inertiajs/react";

export default function RegisterForm() {
  // Inertia's useForm hook handles state and submission
  const { data, setData, post, processing, errors } = useForm({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/register');
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-xl p-6 sm:p-8">
        {/* Logo */}
        <div className="flex justify-center mb-4">
            <img 
                src="/FixMeLogo.svg" 
                alt="FixMe Logo" 
                className="w-16 h-16 object-contain" 
                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/64x64/0056b3/ffffff?text=F M" }}
            />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-blue-800 mb-2">Create your account</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Join FixMe today.</p>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <div className="relative">
                <FaUser className="absolute left-3 top-3 text-gray-400" />
                <input
                    type="text"
                    placeholder="Full Name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
            </div>

            {/* Email Input */}
            <div className="relative">
                <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                <input
                    type="email"
                    placeholder="Email Address"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
            </div>

            {/* Password Input */}
            <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400" />
                <input
                    type="password"
                    placeholder="Password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {errors.password && <div className="text-red-500 text-xs mt-1">{errors.password}</div>}
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400" />
                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={data.password_confirmation}
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={processing}
                className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
            >
                {processing ? 'Registering...' : 'Sign Up'}
            </button>
        </form>

        {/* Social Login Divider */}
        <div className="my-6 flex items-center">
            <hr className="flex-grow border-gray-300" />
            <span className="px-2 text-gray-400 text-sm">or</span>
            <hr className="flex-grow border-gray-300" />
        </div>

        {/* Google Button */}
        <a 
            href="/auth/google"
            className="flex items-center justify-center w-full border border-gray-300 bg-gray-50 py-2 rounded-lg hover:bg-gray-100 transition"
        >
            <FcGoogle className="mr-2 text-xl" />
            <span className="font-medium text-gray-700 text-sm">Continue with Google</span>
        </a>

        {/* Link to Login Page */}
        <p className="mt-6 text-sm text-center text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">Log in</Link>
        </p>
    </div>
  );
}