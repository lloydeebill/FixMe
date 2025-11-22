import React from "react";
// 1. Import the form component we just saved
import RegisterForm from "../Components/RegisterForm"; 

const Register = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      {/* Split Screen Layout Wrapper */}
      <div className="flex flex-col md:flex-row items-center justify-center max-w-6xl w-full gap-10">
        
        {/* LEFT SIDE: App Mockup Image */}
        <div className="hidden md:flex flex-1 justify-end">
          <img
            src="/fixme-mockup.svg"
            alt="FixMe App Mockup"
            className="w-72 sm:w-80 md:w-96 lg:w-[500px] object-contain"
            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x600/0056b3/ffffff?text=Mockup"; }}
          />
        </div>

        {/* RIGHT SIDE: The Register Form Component */}
        <div className="flex-1 flex justify-start items-center w-full">
          <div className="w-full max-w-sm">
            
            {/* 2. Place the form here */}
            <RegisterForm />

          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;