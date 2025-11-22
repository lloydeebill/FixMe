import React from "react";
import Login from "../components/Login";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      {/* Wrapper for both sections */}
      <div className="flex flex-col md:flex-row items-center justify-center max-w-6xl w-full gap-10">
        
        {/* LEFT – App Mockup (hidden on mobile) */}
        <div className="hidden md:flex flex-1 justify-end">
          <img
            src="/fixme-mockup.svg"
            alt="FixMe App Mockup"
            className="w-72 sm:w-80 md:w-96 lg:w-[500px] object-contain"
          />
        </div>

        {/* RIGHT – Login Form (always visible) */}
        <div className="flex-1 flex justify-start items-center w-full">
          <div className="w-full max-w-sm">
            <Login />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
