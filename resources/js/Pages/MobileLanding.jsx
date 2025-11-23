import React from "react";
import AuthSwitch from "../Components/AuthSwitch"; // 👈 Use the AuthSwitch component

export default function MobileLanding() {
  return (
    // This structure is minimal, centered, and fast-loading
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-8">
        <div className="w-full max-w-sm">
            
            {/* Minimal Mobile Header for App Name */}
            <div className="text-center mb-6">
                <img
                    src="/FixMeLogo.svg"
                    alt="FixMe Logo"
                    className="w-12 h-12 object-contain mx-auto mb-2"
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/48x48/0056b3/ffffff?text=F"; }}
                />
                <h1 className="text-xl font-bold text-gray-800">Fix Me - Access</h1>
            </div>
            
            {/* 💥 The core functional element is AuthSwitch 💥 */}
            {/* This renders the Sign In form by default, with tabs for Sign Up */}
            <AuthSwitch /> 
        </div>
    </div>
  );
};