import React, { useState } from "react";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { Link, useForm } from "@inertiajs/react"; // Use Inertia's Link and useForm

// We are assuming React Icon dependencies are installed via npm install react-icons

const Login = () => {
  // 1. Replace useState/Axios with Inertia's useForm hook
  const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
    email: "",
    password: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(name, value); // Use Inertia's setData utility
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 2. Replace Axios call with Inertia's post method
    // The URL is now a standard web route, not an API endpoint.
    // The backend route handles authentication and redirecting on success.
    post('/login', {
        onSuccess: () => {
            // Optional: Show a success toast or message on successful login
            console.log("Login successful! Redirecting...");
        },
        onError: (e) => {
            // Errors are automatically available in the 'errors' object from useForm,
            // but we can log them here too.
            console.error("Login failed:", e);
        }
    });
  };

  // State management for success message, replacing old alert()
  const successMessage = recentlySuccessful ? (
      <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-center text-sm">
          Login successful! Redirecting...
      </div>
  ) : null;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl shadow-xl p-6 sm:p-8">
            {/* Logo */}
            <div className="flex justify-center mb-4">
                <img
                    src="[https://placehold.co/64x64/0056b3/ffffff?text=F](https://placehold.co/64x64/0056b3/ffffff?text=F) M"
                    alt="FixMe Logo"
                    className="w-16 h-16 object-contain"
                    onError={(e) => { e.target.onerror = null; e.target.src = "[https://placehold.co/64x64/0056b3/ffffff?text=F](https://placehold.co/64x64/0056b3/ffffff?text=F) M" }}
                />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-blue-800 mb-6">
                Login your account
            </h2>
            
            {/* Success Message */}
            {successMessage}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="relative">
                    <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
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
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        value={data.password}
                        onChange={handleChange}
                        required
                        className={`w-full border rounded-lg pl-10 pr-10 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                    >
                        {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                    </button>
                    {errors.password && <div className="text-red-500 text-xs mt-1">{errors.password}</div>}
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end">
                    {/* 3. Replace <a> with Inertia Link */}
                    <Link href="/forgot-password" className="text-xs text-gray-500 hover:underline">
                        Forgot Password?
                    </Link>
                </div>

                {/* Sign In Button */}
                <button
                    type="submit"
                    disabled={processing} // Disable while processing
                    className={`w-full font-semibold py-2 rounded-lg transition ${
                        processing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                    {processing ? 'Signing In...' : 'Sign In'}
                </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center">
                <hr className="flex-grow border-gray-300" />
                <span className="px-2 text-gray-400 text-sm">Or log in with</span>
                <hr className="flex-grow border-gray-300" />
            </div>

            {/* Google Login (Using Link for Inertia/Web Auth flow) */}
            <Link
                href="/auth/google" // Assume this is your Laravel Socialite/Web route
                as="button"
                className="flex items-center justify-center w-full border border-gray-300 bg-gray-50 py-2 rounded-lg hover:bg-gray-100 transition"
            >
                <FcGoogle className="mr-2 text-xl" />
                <span className="font-medium text-gray-700 text-sm">Google</span>
            </Link>

            {/* Signup Link */}
            <p className="mt-6 text-sm text-center text-gray-600">
                Don’t have an account?{" "}
                {/* 3. Replace <Link to> with Inertia <Link href> */}
                <Link
                    href="/signup"
                    className="text-blue-600 font-medium hover:underline"
                >
                    Sign Up
                </Link>
            </p>
        </div>
    </div>
  );
};

export default Login;