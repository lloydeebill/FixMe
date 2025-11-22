import React from "react";
import LoginForm from "../Components/LoginForm"; // Ensure this path matches your file structure

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      {/* Wrapper for both sections */}
      <div className="flex flex-col md:flex-row items-center justify-center max-w-6xl w-full gap-10">
        
        {/* LEFT – App Mockup (hidden on mobile) */}
        <div className="hidden md:flex flex-1 justify-end">
          {/* Ensure 'fixme-mockup.svg' exists in your public/ folder! */}
          <img
            src="/fixme-mockup.svg"
            alt="FixMe App Mockup"
            className="w-72 sm:w-80 md:w-96 lg:w-[500px] object-contain"
            // Fallback to prevent broken image icon if file is missing
            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x600/0056b3/ffffff?text=Mockup"; }}
          />
        </div>

        {/* RIGHT – Login Form (always visible) */}
        <div className="flex-1 flex justify-start items-center w-full">
          <div className="w-full max-w-sm">
            {/* This component handles the login logic (useForm, errors, etc.) */}
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;