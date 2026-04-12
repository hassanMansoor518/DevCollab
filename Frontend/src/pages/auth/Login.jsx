import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock } from "react-icons/fi";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider";

const Login = ({ isModal, closeModal, openSignup }) => {
  const [authUser, setAuthUser] = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState("");

  const handelSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const res = await axios.post(
        "/api/auth/user/login",
        { email, password },
        { withCredentials: true }
      );

      localStorage.setItem("ChatApp", JSON.stringify(res.data));
      setAuthUser(res.data);
      navigate("/dashboard");
      if (closeModal) closeModal();
    } catch (error) {
      if (error.response) {
        setErrors(error.response.data?.message || "Login failed");
      } else {
        setErrors("Server not responding");
      }
    }
  };

  return (
    <div className={isModal ? "" : "min-h-screen text-white"}>
      <div
        className={`flex items-center justify-center ${
          isModal ? "" : "min-h-screen bg-gray-950"
        } p-4`}
      >
        <div className="w-full max-w-md">
          <form
            onSubmit={handelSubmit}
            className={`${
              isModal
                ? "bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
                : "bg-gray-900"
            } p-6 sm:p-10 rounded-3xl shadow-2xl space-y-5 relative`}
          >
            {/* Close Button */}
            {isModal && (
              <button
                type="button"
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}

            {/* 🔥 Modern Logo */}
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 
              rounded-2xl flex items-center justify-center border border-blue-500/30 
               backdrop-blur-xl">
                <FiLock className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white text-center">
              User Login
            </h1>
            <p className="text-gray-400 text-sm text-center">
              Welcome back! Let's continue.
            </p>

            {/* Error */}
            {errors && (
              <p className="bg-red-700/80 border-l-4 border-red-500 text-white p-3 rounded text-sm text-center font-medium">
                {errors}
              </p>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-400 uppercase">
                Email
              </label>
              <div className="flex items-center rounded-xl border px-3 py-2 border-gray-700 
              focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 bg-gray-800">
                <FiMail className="w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Email address"
                  className="w-full ml-3 bg-gray-800 text-white outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-400 uppercase">
                Password
              </label>
              <div className="flex items-center rounded-xl border px-3 py-2 border-gray-700 
              focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 bg-gray-800">
                <FiLock className="w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  placeholder="Password"
                  className="w-full ml-3 bg-gray-800 text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* 🔥 Gradient Button */}
            <button
              type="submit"
              className="w-full bg-blue-600
              text-white py-3 rounded-xl font-semibold transition 
             "
            >
              Login
            </button>

            {/* Signup */}
            <p className="text-gray-400 text-sm text-center">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={openSignup}
                className="text-blue-500  font-medium"
              >
                Sign up
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;