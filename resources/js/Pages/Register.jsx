import React, { useState } from "react";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Link, useForm } from "@inertiajs/react"; // Use Inertia's Link and useForm

const Register = () => {
  // 1. Replace useState/Axios with Inertia's useForm hook
  const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
    name: "",
    email: "",
    password: "",
    password_confirmation: "", // Use Laravel's convention for confirmation field
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Map confirmPassword to password_confirmation for Laravel validation consistency
    const fieldName = name === 'confirmPassword' ? 'password_confirmation' : name;
    setData(fieldName, value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 2. Replace Axios call with Inertia's post method
    // The URL is now a standard web route, not an API endpoint.
    post('/register', {
        onSuccess: () => {
            // Optional: Show a success toast or message on successful registration and redirect
            console.log("Registration successful! Redirecting to dashboard/login...");
        },
        onError: (e) => {
            console.error("Registration failed:", e);
        }
    });
  };
  
  // State management for success message, replacing old alert()
  const successMessage = recentlySuccessful ? (
      <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-center text-sm">
          Registration successful! Redirecting...
      </div>
  ) : null;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl shadow-xl p-6 sm:p-8">
            {/* Logo */}
            <div className="flex justify-center mb-4">
                <img
                    src="https://placehold.co/64x64/0056b3/ffffff?text=F M"
                    alt="FixMe Logo"
                    className="w-16 h-16 object-contain"
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/64x64/0056b3/ffffff?text=F M" }}
                />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-blue-800 mb-2">
                Create your account
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
                Join FixMe and get your repairs done fast and easy.
            </p>
            
            {/* Success Message */}
            {successMessage}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div className="relative">
                    <FaUser className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={data.name}
                        onChange={handleChange}
                        required
                        className={`w-full border rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
                </div>

                {/* Email */}
                <div className="relative">
                    <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={data.email}
                        onChange={handleChange}
                        required
                        className={`w-full border rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
                </div>

                {/* Password */}
                <div className="relative">
                    <FaLock className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={data.password}
                        onChange={handleChange}
                        required
                        className={`w-full border rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.password && <div className="text-red-500 text-xs mt-1">{errors.password}</div>}
                </div>

                {/* Confirm Password */}
                <div className="relative">
                    <FaLock className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="password"
                        name="confirmPassword" // Using your original name for convenience
                        placeholder="Confirm Password"
                        value={data.password_confirmation}
                        onChange={handleChange}
                        required
                        className={`w-full border rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.password_confirmation ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.password_confirmation && <div className="text-red-500 text-xs mt-1">{errors.password_confirmation}</div>}
                </div>

                {/* Register Button */}
                <button
                    type="submit"
                    disabled={processing}
                    className={`w-full font-semibold py-2 rounded-lg transition ${
                        processing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                    {processing ? 'Registering...' : 'Sign Up'}
                </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center">
                <hr className="flex-grow border-gray-300" />
                <span className="px-2 text-gray-400 text-sm">or</span>
                <hr className="flex-grow border-gray-300" />
            </div>

            {/* Google Button */}
            <Link
                href="/auth/google"
                as="button"
                className="flex items-center justify-center w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition"
            >
                <FcGoogle className="mr-2 text-xl" />
                <span className="font-medium text-gray-700 text-sm">
                    Continue with Google
                </span>
            </Link>

            {/* Login Link */}
            <p className="mt-6 text-sm text-center text-gray-600">
                Already have an account?{" "}
                {/* 3. Replace <a> with Inertia Link */}
                <Link href="/login" className="text-blue-600 font-medium hover:underline">
                    Log in
                </Link>
            </p>
        </div>
    </div>
  );
};

export default Register;