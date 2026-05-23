import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider";
import { useNavigate } from "react-router-dom";

import { FiUser, FiMail, FiLock } from "react-icons/fi";
import { Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;

const Signup = ({ isModal = false, closeModal, openLogin }) => {
  const [authUser, setAuthUser] = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [oauthLoading, setOauthLoading] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch("password", "");

  const validatePasswordMatch = (value) =>
    value === password || "Passwords do not match";

  // ─── Handle OAuth success response ────────────────────────────
  const handleOAuthSuccess = useCallback(
    (data) => {
      localStorage.setItem("ChatApp", JSON.stringify(data));
      setAuthUser(data);
      if (isModal && closeModal) closeModal();
      navigate("/dashboard");
    },
    [setAuthUser, navigate, closeModal, isModal]
  );

  // ─── Google Sign-In ───────────────────────────────────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initializeGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
        });
      }
    };

    if (!document.getElementById("google-gsi-script")) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.head.appendChild(script);
    } else {
      initializeGoogle();
    }
  }, []);

  const handleGoogleResponse = async (response) => {
    try {
      setOauthLoading("google");
      setError("");

      const res = await axios.post(
        "/api/auth/oauth/google",
        { credential: response.credential },
        { withCredentials: true }
      );

      handleOAuthSuccess(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Google authentication failed"
      );
    } finally {
      setOauthLoading("");
    }
  };

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError("Google Client ID is not configured");
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback: render a hidden Google button and click it
          const btnContainer = document.createElement("div");
          btnContainer.style.position = "fixed";
          btnContainer.style.top = "-1000px";
          document.body.appendChild(btnContainer);

          window.google.accounts.id.renderButton(btnContainer, {
            type: "standard",
            size: "large",
          });

          const btn = btnContainer.querySelector('[role="button"]') || btnContainer.querySelector("div[id^='g_']");
          if (btn) {
            btn.click();
          }

          setTimeout(() => btnContainer.remove(), 2000);
        }
      });
    } else {
      setError("Google Sign-In is still loading. Please try again.");
    }
  };

  // ─── GitHub Sign-In ───────────────────────────────────────────
  useEffect(() => {
    const handleGithubCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");

      if (code && state === "github_oauth") {
        try {
          setOauthLoading("github");
          setError("");

          window.history.replaceState({}, document.title, window.location.pathname);

          const res = await axios.post(
            "/api/auth/oauth/github",
            { code },
            { withCredentials: true }
          );

          handleOAuthSuccess(res.data);
        } catch (err) {
          setError(
            err.response?.data?.message || "GitHub authentication failed"
          );
          setOauthLoading("");
        }
      }
    };

    handleGithubCallback();
  }, [handleOAuthSuccess]);

  const handleGithubLogin = () => {
    if (!GITHUB_CLIENT_ID) {
      setError("GitHub Client ID is not configured");
      return;
    }

    setOauthLoading("github");
    const redirectUri = window.location.origin + window.location.pathname;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=github_oauth`;
    window.location.href = githubAuthUrl;
  };

  // ─── Email/Password Signup ───────────────────────────────────
  const onSubmit = async (data) => {
    try {
      const response = await axios.post(
        "/api/auth/user/register",
        {
          fullName: data.fullname,
          email: data.email,
          password: data.password,
        },
        { withCredentials: true }
      );

      localStorage.setItem(
        "ChatApp",
        JSON.stringify(response.data)
      );

      setAuthUser(response.data);

      if (isModal && closeModal) closeModal();

      if (isModal) navigate("/dashboard");
      else navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message || "Signup failed"
      );
    }
  };

  return (
    <div
      className={`${isModal
        ? ""
        : "min-h-screen bg-background flex items-center justify-center px-4 py-10 overflow-hidden"
        } relative`}
    >
      {/* Background Glow */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-primary/20 blur-[120px] rounded-full"></div>

      <div className="absolute bottom-10 right-10 w-72 h-72 bg-info/20 blur-[120px] rounded-full"></div>

      {/* Card */}
      <div className="w-full max-w-md relative z-10">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="
            relative
            bg-surface/80
            backdrop-blur-2xl
            border border-border-default
            rounded-[32px]
            px-8 py-8
            shadow-popover
            space-y-2
          "
        >
          {/* Close Button */}
          {isModal && (
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-5 right-5 text-text-muted hover:text-text-primary transition"
            >
              ✕
            </button>
          )}

          {/* Logo */}
          <div className="flex justify-center">
            <div className="flex gap-1">
              <div className="w-2 h-8 rounded-full bg-primary"></div>
              <div className="w-2 h-8 rounded-full bg-info"></div>
              <div className="w-2 h-8 rounded-full bg-indigo-400"></div>
              <div className="w-2 h-8 rounded-full bg-cyan-400"></div>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-text-primary">
              Create Account
            </h1>

            <p className="text-text-secondary text-sm">
              Join DevCollab and start building
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-error-soft border border-error/20 text-error text-sm rounded-xl p-3">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide font-semibold text-text-muted">
              Full Name
            </label>

            <div
              className="
                flex items-center
                h-12
                px-4
                rounded-xl
                bg-input-bg
                border border-border-default
                focus-within:border-primary
                focus-within:ring-2
                focus-within:ring-primary/20
                transition
              "
            >
              <FiUser className="text-text-muted" />

              <input
                type="text"
                placeholder="Enter your full name"
                {...register("fullname", {
                  required: "Full name is required",
                })}
                className="
                  w-full ml-3
                  bg-transparent
                  outline-none
                  text-text-primary
                  placeholder:text-text-muted
                "
              />
            </div>

            {errors.fullname && (
              <p className="text-error text-sm">
                {errors.fullname.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide font-semibold text-text-muted">
              Email
            </label>

            <div
              className="
                flex items-center
                h-12
                px-4
                rounded-xl
                bg-input-bg
                border border-border-default
                focus-within:border-primary
                focus-within:ring-2
                focus-within:ring-primary/20
                transition
              "
            >
              <FiMail className="text-text-muted" />

              <input
                type="email"
                placeholder="Email address"
                {...register("email", {
                  required: "Email is required",
                })}
                className="
                  w-full ml-3
                  bg-transparent
                  outline-none
                  text-text-primary
                  placeholder:text-text-muted
                "
              />
            </div>

            {errors.email && (
              <p className="text-error text-sm">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide font-semibold text-text-muted">
              Password
            </label>

            <div
              className="
                flex items-center
                h-12
                px-4
                rounded-xl
                bg-input-bg
                border border-border-default
                focus-within:border-primary
                focus-within:ring-2
                focus-within:ring-primary/20
                transition
              "
            >
              <FiLock className="text-text-muted" />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                {...register("password", {
                  required: "Password is required",
                })}
                className="
                  w-full ml-3
                  bg-transparent
                  outline-none
                  text-text-primary
                  placeholder:text-text-muted
                "
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="text-text-muted hover:text-text-primary transition"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {errors.password && (
              <p className="text-error text-sm">
                {errors.password.message}
              </p>
            )}

            <div>
              <label className="text-xs uppercase tracking-wide font-semibold text-text-muted mb-2 block">
                Confirm Password
              </label>

              <div
                className="
              flex items-center
              h-12
              px-4
              rounded-xl
              bg-input-bg
              border border-border-default
              focus-within:border-primary
              focus-within:ring-2
              focus-within:ring-primary/20
              transition
            "
              >
                <FiLock className="text-text-muted" />

                <input
                  type={
                    showConfirmPassword ? "text" : "password"
                  }
                  placeholder="Confirm password"
                  {...register("confirmPassword", {
                    required:
                      "Confirm password is required",
                    validate: validatePasswordMatch,
                  })}
                  className="
                w-full ml-3
                bg-transparent
                outline-none
                text-text-primary
                placeholder:text-text-muted
              "
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  className="text-text-muted hover:text-text-primary"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3 text-sm text-text-secondary mt-2">
            <input
              type="checkbox"
              className="mt-1 accent-primary"
            />

            <p className="leading-6">
              I have read and accept the{" "}
              <span className="text-primary cursor-pointer hover:underline">
                Terms of Service
              </span>{" "}
              and{" "}
              <span className="text-primary cursor-pointer hover:underline">
                Privacy Policy
              </span>
            </p>
          </div>

          {/* Button */}
          <button
            disabled={isSubmitting}
            className="
              w-full h-12
              rounded-xl
              bg-primary
              hover:bg-primary-hover
              transition-all duration-300
              text-white font-semibold
              shadow-md
            "
          >
            {isSubmitting
              ? "Creating Account..."
              : "SIGN UP"}
          </button>

          {/* Footer */}
          <p className="text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <button
              type="button"
              onClick={openLogin}
              className="text-primary hover:text-primary-hover font-medium"
            >
              Sign In
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;