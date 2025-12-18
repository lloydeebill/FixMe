import React from "react";
import AuthSwitch from "../Components/AuthSwitch";
import { usePage } from "@inertiajs/react"; // 👈 Import usePage to get the backend message

export default function Login() {
  // 1. Get the flash data from Laravel
  const { flash } = usePage().props;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      {/* Wrapper for both sections */}
      <div className="flex flex-col md:flex-row items-center justify-center max-w-6xl w-full gap-10">
        
        {/* LEFT – App Mockup (Hidden on mobile) */}
        <div className="hidden md:flex flex-1 justify-end">
          <img
            src="/fixme-mockup.svg"
            alt="FixMe App Mockup"
            className="w-72 sm:w-80 md:w-96 lg:w-[500px] object-contain"
            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x600/0056b3/ffffff?text=Mockup"; }}
          />
        </div>

        {/* RIGHT – Auth Switch & Global Alerts */}
        <div className="flex-1 flex flex-col justify-start items-center w-full">
          <div className="w-full max-w-sm">
            
            {/* 
                This sits OUTSIDE the AuthSwitch, so it stays visible 
                even when the form switches or reloads. 
            */}
            {flash.message && (
                <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 shadow-md rounded-r">
                    <div className="flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span className="font-bold">Success!</span>
                    </div>
                    <p className="mt-1 text-sm">{flash.message}</p>
                </div>
            )}

            {/* This component handles the switching between Login and Register forms */}
            <AuthSwitch /> 
            
          </div>
        </div>
      </div>
    </div>
  );
};