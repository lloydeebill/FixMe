import React from "react";
import Register from "./Register";

const Signup = () => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#1b6ed1" }}
    >
      {/* Wrapper for both sections */}
      <div className="flex flex-col md:flex-row items-center justify-center max-w-6xl w-full gap-16">
        
        {/* LEFT – App Mockup (hidden on mobile) */}
        <div className="hidden md:flex flex-1 justify-end">
          <img
            src="/fixme-mockup.svg"
            alt="FixMe App Mockup"
            className="w-72 sm:w-80 md:w-96 lg:w-[550px] object-contain"
          />
        </div>

        {/* RIGHT – Register Form (always visible) */}
        <div className="flex-1 flex justify-center items-center w-full">
          <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg">
            <Register />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
