import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock } from "react-icons/fi";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;

const Login = ({ isModal, closeModal, openSignup }) => {
  const [authUser, setAuthUser] = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState("");
  const [oauthLoading, setOauthLoading] = useState("");

  // ─── Handle OAuth success response ────────────────────────────
  const handleOAuthSuccess = useCallback(
    (data) => {
      localStorage.setItem("ChatApp", JSON.stringify(data));
      setAuthUser(data);
      navigate("/dashboard");
      if (closeModal) closeModal();
    },
    [setAuthUser, navigate, closeModal]
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

    // Load Google Identity Services script
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
      setErrors("");

      const res = await axios.post(
        "/api/auth/oauth/google",
        { credential: response.credential },
        { withCredentials: true }
      );

      handleOAuthSuccess(res.data);
    } catch (error) {
      setErrors(
        error.response?.data?.message || "Google authentication failed"
      );
    } finally {
      setOauthLoading("");
    }
  };

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      setErrors("Google Client ID is not configured");
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
      setErrors("Google Sign-In is still loading. Please try again.");
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
          setErrors("");

          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);

          const res = await axios.post(
            "/api/auth/oauth/github",
            { code },
            { withCredentials: true }
          );

          handleOAuthSuccess(res.data);
        } catch (error) {
          setErrors(
            error.response?.data?.message || "GitHub authentication failed"
          );
          setOauthLoading("");
        }
      }
    };

    handleGithubCallback();
  }, [handleOAuthSuccess]);

  const handleGithubLogin = () => {
    if (!GITHUB_CLIENT_ID) {
      setErrors("GitHub Client ID is not configured");
      return;
    }

    setOauthLoading("github");
    const redirectUri = window.location.origin + window.location.pathname;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=github_oauth`;
    window.location.href = githubAuthUrl;
  };

  // ─── Email/Password Login ────────────────────────────────────
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
    <div
      className={`${isModal
        ? ""
        : "min-h-screen bg-[#050816] flex items-center justify-center px-4 py-10 overflow-hidden"
        } relative`}
    >
      {/* Background Glow */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-600/20 blur-[120px] rounded-full"></div>

      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-600/20 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md relative z-10">
        <form
          onSubmit={handelSubmit}
          className="
          relative
          bg-white/5
          backdrop-blur-2xl
          border border-white/10
          rounded-[32px]
          px-8 py-8
          shadow-[0_20px_80px_rgba(0,0,0,0.6)]
          space-y-3
        "
        >
          {/* Close */}
          {isModal && (
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-5 right-5 text-gray-400 hover:text-white transition"
            >
              ✕
            </button>
          )}

          {/* Logo */}
          <div className="flex justify-center">
            <div className="flex gap-1">
              <div className="w-2 h-8 rounded-full bg-blue-500"></div>
              <div className="w-2 h-8 rounded-full bg-blue-400"></div>
              <div className="w-2 h-8 rounded-full bg-indigo-400"></div>
              <div className="w-2 h-8 rounded-full bg-cyan-400"></div>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-white">
              Welcome Back
            </h1>

            <p className="text-gray-400 text-sm">
              Login to continue to DevCollab
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={oauthLoading === "google"}
              className="
                          w-full h-12
                          rounded-xl
                          bg-white/5
                          border border-white/10
                          hover:bg-white/10
                          hover:border-white/20
                          transition-all duration-300
                          flex items-center justify-center gap-3
                          text-white font-medium
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
            >
              {oauthLoading === "google" ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <FcGoogle size={20} />
              )}
              {oauthLoading === "google" ? "Connecting..." : "Continue with Google"}
            </button>

            <button
              type="button"
              onClick={handleGithubLogin}
              disabled={oauthLoading === "github"}
              className="
                          w-full h-12
                          rounded-xl
                          bg-white/5
                          border border-white/10
                          hover:bg-white/10
                          hover:border-white/20
                          transition-all duration-300
                          flex items-center justify-center gap-3
                          text-white font-medium
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
            >
              {oauthLoading === "github" ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <FaGithub size={18} />
              )}
              {oauthLoading === "github" ? "Connecting..." : "Continue with GitHub"}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[1px] bg-white/10"></div>

            <span className="text-xs text-gray-500">
              or sign up with email
            </span>

            <div className="flex-1 h-[1px] bg-white/10"></div>
          </div>

          {/* Error */}
          {errors && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-3">
              {errors}
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide font-semibold text-gray-400">
              Email
            </label>

            <div
              className="
              flex items-center
              h-12
              px-4
              rounded-xl
              bg-white/5
              border border-white/10
              focus-within:border-blue-500
              focus-within:ring-2
              focus-within:ring-blue-500/20
              transition
            "
            >
              <FiMail className="text-gray-400" />

              <input
                type="email"
                name="email"
                required
                placeholder="Email address"
                className="
                w-full ml-3
                bg-transparent
                outline-none
                text-white
                placeholder:text-gray-500
              "
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide font-semibold text-gray-400">
              Password
            </label>

            <div
              className="
              flex items-center
              h-12
              px-4
              rounded-xl
              bg-white/5
              border border-white/10
              focus-within:border-blue-500
              focus-within:ring-2
              focus-within:ring-blue-500/20
              transition
            "
            >
              <FiLock className="text-gray-400" />

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                placeholder="Password"
                className="
                w-full ml-3
                bg-transparent
                outline-none
                text-white
                placeholder:text-gray-500
              "
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-white transition"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                className="accent-blue-500"
              />
              Remember me
            </label>

            <button
              type="button"
              className="text-blue-400 hover:text-blue-300"
            >
              Forgot password?
            </button>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="
            w-full h-12
            rounded-xl
            bg-blue-600
            hover:bg-blue-700
            transition-all duration-300
            text-white font-semibold
            shadow-lg shadow-blue-500/30
          "
          >
            Login
          </button>

          {/* Footer */}
          <p className="text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={openSignup}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Sign up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;