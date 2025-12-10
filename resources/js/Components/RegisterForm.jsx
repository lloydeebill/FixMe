import React from "react";
import { FcGoogle } from "react-icons/fc";
import { Link } from "@inertiajs/react";

export default function RegisterForm() {
  // We removed useForm and all state variables since we aren't processing inputs manually anymore.

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
        <p className="text-sm text-gray-500 text-center mb-8">
            Join FixMe instantly. No password required.
        </p>

        {/* Google Button - Now the Main and Only Action */}
        <a 
            href="/auth/google"
            className="flex items-center justify-center w-full border border-gray-300 bg-white py-3 rounded-lg hover:bg-gray-50 transition shadow-sm group"
        >
            <FcGoogle className="mr-3 text-2xl group-hover:scale-110 transition-transform" />
            <span className="font-medium text-gray-700 text-base">Continue with Google</span>
        </a>

        {/* Link to Login Page */}
        <p className="mt-8 text-sm text-center text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">Log in</Link>
        </p>
    </div>
  );
}