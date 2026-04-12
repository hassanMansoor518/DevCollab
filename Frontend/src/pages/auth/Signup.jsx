import React, { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider";
import { useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock } from "react-icons/fi";
import { Eye, EyeOff } from "lucide-react";

const Signup = ({ isModal = false, closeModal, openLogin }) => {
  const [authUser, setAuthUser] = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch("password", "");
  const validatePasswordMatch = (value) =>
    value === password || "Passwords do not match";

  const onSubmit = async (data) => {
    try {
      const response = await axios.post(
        "http://localhost:3001/api/auth/user/register",
        {
          fullName: data.fullname,
          email: data.email,
          password: data.password,
        },
        { withCredentials: true }
      );

      localStorage.setItem("ChatApp", JSON.stringify(response.data));
      setAuthUser(response.data);

      if (isModal && closeModal) closeModal();
      if (isModal) navigate("/dashboard");
      else navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

 return (
  <div className={isModal ? "" : "min-h-screen bg-gray-950 text-white flex items-center justify-center p-4"}>
    
    <div className="w-full max-w-md">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="
          relative space-y-5 p-6 sm:p-10 rounded-3xl
          bg-white/5 backdrop-blur-xl
          border border-white/10
          shadow-[0_0_40px_rgba(0,0,0,0.5)]
        "
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

        {/* Logo (SAME as Login) */}
        <div className="flex justify-center mb-2">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-blue-500/30 backdrop-blur-xl">
            <FiLock className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-white">
          Create Account
        </h1>

        <p className="text-gray-400 text-sm text-center">
          Join DevCollab and start building
        </p>

        {/* Error */}
        {error && (
          <p className="bg-red-700/80 border-l-4 border-red-500 text-white p-3 rounded text-sm text-center">
            {error}
          </p>
        )}

        {/* Inputs (same style feel as Login) */}
        <InputField
          icon={<FiUser />}
          placeholder="Full Name"
          error={errors.fullname?.message}
          register={register("fullname", {
            required: "Full name is required",
          })}
        />

        <InputField
          icon={<FiMail />}
          placeholder="Email"
          error={errors.email?.message}
          register={register("email", {
            required: "Email is required",
          })}
        />

        <PasswordField
          icon={<FiLock />}
          placeholder="Password"
          show={showPassword}
          toggle={() => setShowPassword(!showPassword)}
          register={register("password", {
            required: "Password is required",
          })}
        />

        <PasswordField
          icon={<FiLock />}
          placeholder="Confirm Password"
          show={showConfirmPassword}
          toggle={() => setShowConfirmPassword(!showConfirmPassword)}
          register={register("confirmPassword", {
            required: "Confirm password is required",
            validate: validatePasswordMatch,
          })}
        />

        {/* BUTTON (NOW EXACT LOGIN STYLE) */}
        <button
          disabled={isSubmitting}
          className="
            w-full bg-blue-600
            text-white py-3 rounded-xl font-semibold
            transition hover:bg-blue-700
          "
        >
          {isSubmitting ? "Creating Account..." : "Sign Up"}
        </button>

        {/* Switch */}
        <p className="text-gray-400 text-sm text-center">
          Already have an account?{" "}
          <button
            type="button"
            onClick={openLogin}
            className="text-blue-500 font-medium"
          >
            Login
          </button>
        </p>
      </form>
    </div>
  </div>
);
};

/* Reusable Input */
const InputField = ({ icon, placeholder, register, error }) => (
  <div>
    <div className="flex items-center border border-gray-700 bg-gray-800 rounded-xl px-3 py-2 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
      <span className="text-gray-400">{icon}</span>
      <input
        className="w-full ml-3 bg-gray-800 text-white outline-none"
        placeholder={placeholder}
        {...register}
      />
    </div>
    {error && <p className="text-red-500 text-sm">{error}</p>}
  </div>
);

/* Password Field */
const PasswordField = ({ icon, placeholder, show, toggle, register }) => (
  <div className="flex items-center border border-gray-700 bg-gray-800 rounded-xl px-3 py-2 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
    <span className="text-gray-400">{icon}</span>
    <input
      type={show ? "text" : "password"}
      className="w-full ml-3 bg-gray-800 text-white outline-none"
      placeholder={placeholder}
      {...register}
    />
    <button type="button" onClick={toggle} className="text-gray-400">
      {show ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  </div>
);

export default Signup;