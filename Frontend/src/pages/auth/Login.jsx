import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { FaApple, FaFacebookF } from "react-icons/fa";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider";

const Login = () => {
  const [authUser, setAuthUser] = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState("");

  const handelSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try{
      const res = await axios.post(
        "http://localhost:3001/api/auth/user/login",
        { email, password },
        { withCredentials: true }
      );
      console.log(res.data)
      localStorage.setItem("ChatApp", JSON.stringify(res.data));
      setAuthUser(res.data);
      navigate("/");

    }catch(error){
      if (error.response) {
        setErrors(error.response.data?.message || "Login failed");
      } else {
        setErrors("Server not responding");
      }
  };
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md">
        <form className="bg-gray-900 p-6 sm:p-10 rounded-3xl shadow-2xl space-y-5" onSubmit={handelSubmit}>

          {/* Logo */}
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center border border-teal-500/30">
              <FiLock className="w-10 h-10 text-teal-400" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-white text-center">User Login</h1>
          <p className="text-gray-400 text-sm text-center">Welcome back! Let's continue.</p>

          {/* General Error */}
          {errors && (
            <p className="bg-red-700/80 border-l-4 border-red-500 text-white p-3 rounded text-sm text-center font-medium">
              {errors}
            </p>
          )}

          {/* Email Input */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-xs font-semibold text-gray-400 uppercase">Email</label>
            <div className="flex items-center rounded-xl border px-3 py-2 transition-colors duration-200 w-full border-gray-700 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 bg-gray-800">
              <FiMail className="w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                required
                className="w-full ml-3 bg-gray-800 text-white placeholder-gray-500 outline-none"

              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-xs font-semibold text-gray-400 uppercase">Password</label>
            <div className="flex items-center rounded-xl border px-3 py-2 transition-colors duration-200 w-full border-gray-700 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 bg-gray-800">
              <FiLock className="w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                required
                className="w-full ml-3 bg-gray-800 text-white placeholder-gray-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-gray-400 hover:text-teal-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center bg-teal-500 hover:bg-teal-600 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-lg shadow-teal-500/30 shadow-lg transition duration-300 transform hover:scale-[1.01]"
          >
            Sign in
          </button>

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-1 h-px bg-gray-700"></div>
            <span className="px-3 text-gray-500 text-sm">Or sign in with</span>
            <div className="flex-1 h-px bg-gray-700"></div>
          </div>

          {/* Social Login Buttons */}
          <div className="flex justify-center gap-4 mt-4">
            <button className="border border-gray-700 bg-gray-800 p-3 rounded-xl hover:border-teal-500 transition-colors">
              <FcGoogle size={22} />
            </button>
            <button className="border border-gray-700 bg-gray-800 p-3 rounded-xl hover:border-teal-500 transition-colors">
              <FaApple size={22} />
            </button>
            <button className="border border-gray-700 bg-gray-800 p-3 rounded-xl hover:border-teal-500 transition-colors text-blue-500">
              <FaFacebookF size={22} />
            </button>
          </div>

          {/* Footer */}
          <p className="text-gray-400 text-sm text-center mt-4">
            Don't have an account?{" "}
            <Link to="/signup" className="text-teal-400 hover:text-teal-300 font-medium">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
