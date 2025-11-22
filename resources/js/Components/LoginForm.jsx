import React, { useState } from "react";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { Link, useForm } from "@inertiajs/react";

export default function LoginForm() {
  const { data, setData, post, processing, errors } = useForm({
    email: "",
    password: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [logoSrc, setLogoSrc] = useState("/FixMeLogo.svg");

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/login');
  };

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

        <h2 className="text-2xl font-bold text-center text-blue-800 mb-6">
            Login your account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
                <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
            </div>

            <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400" />
                <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
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

            <div className="flex justify-end">
                <Link href="/forgot-password" className="text-xs text-gray-500 hover:underline">
                    Forgot Password?
                </Link>
            </div>

            <button
                type="submit"
                disabled={processing}
                className={`w-full font-semibold py-2 rounded-lg transition ${
                    processing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
                {processing ? 'Signing In...' : 'Sign In'}
            </button>
        </form>

        <div className="my-6 flex items-center">
            <hr className="flex-grow border-gray-300" />
            <span className="px-2 text-gray-400 text-sm">Or log in with</span>
            <hr className="flex-grow border-gray-300" />
        </div>

        <a
            href="/auth/google"
            className="flex items-center justify-center w-full border border-gray-300 bg-gray-50 py-2 rounded-lg hover:bg-gray-100 transition"
        >
            <FcGoogle className="mr-2 text-xl" />
            <span className="font-medium text-gray-700 text-sm">Google</span>
        </a>

        <p className="mt-6 text-sm text-center text-gray-600">
            Don’t have an account?{" "}
            <Link href="/signup" className="text-blue-600 font-medium hover:underline">
                Sign Up
            </Link>
        </p>
    </div>
  );
}