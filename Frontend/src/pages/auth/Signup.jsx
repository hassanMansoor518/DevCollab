import React, { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiUser, FiMail, FiLock } from "react-icons/fi";
import { Eye, EyeOff } from "lucide-react";

function Signup() {
  const [authUser, setAuthUser] = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password", "");
  const validatePasswordMatch = (value) =>
    value === password || "Passwords do not match";

  const onSubmit = async (data) => {
    const userInfo = {
      fullName: data.fullname,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
    };

    try {
      const response = await axios.post(
        "http://localhost:3001/api/auth/user/register",
        userInfo,
        { withCredentials: true }
      );
      
      localStorage.setItem("ChatApp", JSON.stringify(response.data));
      setAuthUser(response.data);
      navigate("/");
    }catch(error){
      if (error.response) {
        setError(error.response.data?.message || "Signup failed");
      } else {
        setError("Server not responding");
      }
  };
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-gray-900 p-6 sm:p-10 rounded-3xl shadow-2xl space-y-5"
        >
          {/* Logo */}
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center border border-teal-500/30">
              <FiLock className="w-8 h-8 text-teal-400" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-white text-center">User Signup</h1>
          <p className="text-gray-400 text-sm text-center">
            Create your account and start chatting
          </p>

             {/* General Error */}
          {error && (
            <p className="bg-red-700/80 border-l-4 border-red-500 text-white p-3 rounded text-sm text-center font-medium">
              {error}
            </p>
          )}


          {/* Fullname */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-400 uppercase">
              Fullname
            </label>
            <div className="flex items-center rounded-xl border px-3 py-1.5 transition-colors duration-200 w-full border-gray-700 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 bg-gray-800">
              <FiUser className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Fullname"
                {...register("fullname", { required: true })}
                className="w-full ml-3 bg-gray-800 text-white placeholder-gray-500 outline-none"
              />
            </div>
            {errors.fullname && (
              <span className="text-red-500 text-sm">{errors.fullname.message || "Fullname is required"}</span>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-400 uppercase">
              Email
            </label>
            <div className="flex items-center rounded-xl border px-2 py-1.5 transition-colors duration-200 w-full border-gray-700 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 bg-gray-800">
              <FiMail className="w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="Email"
                {...register("email", { required: true })}
                className="w-full ml-3 bg-gray-800 text-white placeholder-gray-500 outline-none"
              />
            </div>
            {errors.email && (
              <span className="text-red-500 text-sm">{errors.email.message || "Email is required"}</span>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-400 uppercase">
              Password
            </label>
            <div className="flex items-center rounded-xl border px-2 py-1.5 transition-colors duration-200 w-full border-gray-700 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 bg-gray-800">
               
              <FiLock className="w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}

                placeholder="Password"
                {...register("password", { required: true })}
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
            {errors.password && (
              <span className="text-red-500 text-sm">{errors.password.message || "Password is required"}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-400 uppercase">
              Confirm Password
            </label>
            <div className="flex items-center rounded-xl border px-2 py-1.5 transition-colors duration-200 w-full border-gray-700 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 bg-gray-800">
              <FiLock className="w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                
                placeholder="Confirm Password"
                {...register("confirmPassword", {
                  required: true,
                  validate: validatePasswordMatch,
                })}
                className="w-full ml-3 bg-gray-800 text-white placeholder-gray-500 outline-none"
             
    
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="ml-2 text-gray-400 hover:text-teal-400"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="text-red-500 text-sm">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          {/* Submit */}
          <button className="w-full h-12 flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl font-semibold text-md shadow-teal-500/30 shadow-lg transition duration-300 transform hover:scale-[1.01]">
            Signup
          </button>

          {/* Footer */}
          <p className="text-gray-400 text-sm text-center mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-teal-400 hover:text-teal-300 font-medium">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Signup;
