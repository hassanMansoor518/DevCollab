import React from "react";
import {
  FiFileText,
  FiMessageSquare,
  FiCheckCircle,
} from "react-icons/fi";
import { AiOutlineStar } from "react-icons/ai";
import { Code2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function DashboardLeftSide() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path) => {
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-72 bg-[#060A14] flex flex-col justify-between p-6 border-r border-gray-700">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <div className="bg-blue-600 p-2 rounded-md text-white">
            <Code2 size={18} />
          </div>
          <div>
            <span className="font-semibold text-lg text-white">
              DevCollab
            </span>
            <div className="text-xs text-gray-400">
              Developer Workplace
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 text-gray-300">
          {/* Dashboard */}
          <button
            onClick={() => handleNavigate("/dashboard")}
            className={`flex items-center w-full px-3 py-2 rounded-lg transition ${
              isActive("/dashboard")
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-700"
            }`}
          >
            <FiFileText className="mr-2" />
            Dashboard
          </button>

          {/* Projects */}
          <button
            onClick={() => handleNavigate("/project")}
            className={`flex items-center w-full px-3 py-2 rounded-lg transition ${
              isActive("/project")
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-700"
            }`}
          >
            <FiFileText className="mr-2" />
            Projects
          </button>

          {/* Chat */}
          <button
            onClick={() => handleNavigate("/chat")}
            className={`flex items-center w-full px-3 py-2 rounded-lg transition ${
              isActive("/chat")
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-700"
            }`}
          >
            <FiMessageSquare className="mr-2" />
            Chat
          </button>

          <div className="border-t border-gray-700 my-8" />

          {/* Settings */}
          <button className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-gray-700 transition">
            <FiCheckCircle className="mr-2" />
            Settings
          </button>

          {/* Help */}
          <button className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-gray-700 transition">
            <AiOutlineStar className="mr-2" />
            Help Center
          </button>
        </nav>
      </div>

      {/* Pro Plan Card */}
      <div className="mt-10 border-t border-gray-700 pt-4">
        <div className="p-6 bg-slate-900 rounded-lg text-center cursor-pointer hover:bg-gray-900 transition">
          <p className="text-sm font-semibold text-blue-600 mb-2">
            PRO PLAN
          </p>
          <p className="text-xs text-gray-300">
            Get unlimited storage and AI credits.
          </p>
          <button className="mt-2 bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 transition text-white">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}
