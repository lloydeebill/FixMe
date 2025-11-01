import React, { useState } from "react";
import axios from "axios";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";

const Login = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://127.0.0.1:8000/api/login", form);
      alert("Login successful!");
      console.log(res.data);
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      alert("Login failed!");
    }
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm p-8">
      {/* Logo */}
      <div className="flex justify-center mb-4">
        <img
          src="/FixMeLogo.svg"
          alt="FixMe Logo"
          className="w-16 h-16 object-contain"
        />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-center text-blue-800 mb-6">
        Login your account
      </h2>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="relative">
          <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <FaLock className="absolute left-3 top-3 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
          </button>
        </div>

        {/* Forgot Password */}
        <div className="flex justify-end">
          <a href="/forgot-password" className="text-xs text-gray-500 hover:underline">
            Forgot Password?
          </a>
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Sign In
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center">
        <hr className="flex-grow border-gray-300" />
        <span className="px-2 text-gray-400 text-sm">Or log in with</span>
        <hr className="flex-grow border-gray-300" />
      </div>

      {/* Google Login */}
      <button
        type="button"
        className="flex items-center justify-center w-full border border-gray-300 bg-gray-50 py-2 rounded-lg hover:bg-gray-100 transition"
      >
        <FcGoogle className="mr-2 text-xl" />
        <span className="font-medium text-gray-700 text-sm">Google</span>
      </button>

      {/* Signup Link */}
      <p className="mt-6 text-sm text-center text-gray-600">
        Don’t have an account?{" "}
        <Link
          to="/signup"
          className="text-blue-600 font-medium hover:underline"
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
};

export default Login;
