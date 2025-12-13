import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link } from "@inertiajs/react";

export default function LoginForm() {
  // We removed useForm and manual input states. 
  // We kept the logo state logic since you had a specific error handler for it.
  const [logoSrc, setLogoSrc] = useState("/FixMeLogo.svg");

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-xl p-6 sm:p-8">
        {/* Logo */}
        <div className="flex justify-center mb-4">
            <img
                src={logoSrc}
                alt="FixMe Logo"
                className="w-16 h-16 object-contain"
                onError={() => setLogoSrc("https://placehold.co/64x64/0056b3/ffffff?text=F M")}
            />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-blue-800 mb-2">
            Welcome Back
        </h2>
        <p className="text-sm text-gray-500 text-center mb-8">
            Login to access your dashboard.
        </p>

        {/* Google Login Button - Main Action */}
        <a
            href="/auth/google"
            className="flex items-center justify-center w-full border border-gray-300 bg-white py-3 rounded-lg hover:bg-gray-50 transition shadow-sm group"
        >
            <FcGoogle className="mr-3 text-2xl group-hover:scale-110 transition-transform" />
            <span className="font-medium text-gray-700 text-base">Continue with Google</span>
        </a>

        {/* Link to Signup Page */}
        <p className="mt-8 text-sm text-center text-gray-600">
            Don’t have an account?{" "}
            {/* Note: I kept this pointing to '/signup' as per your code, 
                but check if your route is named '/register' or '/signup' */}
            <Link href="/signup" className="text-blue-600 font-medium hover:underline">
                Sign Up
            </Link>
        </p>
    </div>
  );
}