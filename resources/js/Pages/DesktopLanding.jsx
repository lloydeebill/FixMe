// resources/js/Pages/DesktopLanding.jsx

import React from "react";
// 👈 IMPORTANT: Import the Inertia Link component
import { Link } from '@inertiajs/react'; 

const DesktopLanding = () => {
  return (
    // Centering the content on the screen
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      
      <div className="text-center max-w-2xl">
        
        {/* Main Welcome Message */}
        <h1 className="text-6xl font-extrabold text-blue-800 mb-4">
          Hello! Welcome to FixMe
        </h1>
        
        <p className="text-xl text-gray-600 mb-10">
          Your one-stop solution for connecting with verified Filipino repair and trade experts.
        </p>

        {/* The essential button that leads to the Login page */}
        <Link
          // Set the href to the route that renders your Login.jsx page
          href="/login" 
          // Style the Inertia Link component as a button using Tailwind CSS
          className="inline-block px-12 py-4 text-xl font-bold text-white bg-red-600 rounded-lg shadow-lg hover:bg-red-700 transition duration-300 transform hover:scale-105"
        >
          Go to Sign In / Sign Up
        </Link>
        
      </div>
    </div>
  );
};

export default DesktopLanding;