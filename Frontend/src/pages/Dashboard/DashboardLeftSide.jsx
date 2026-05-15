import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Logout from "../../component/Logout";
import {
  LayoutDashboard,
  Folder,
  Users,
  Bot,
  Settings,
  HelpCircle,
  Code2,
  FileText,
  Menu,
  ChevronRight
} from "lucide-react";

export default function DashboardLeftSide() {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);

  // AUTO OPEN ON CHAT PAGE
  useEffect(() => {
    if (location.pathname === "/chat") {
      setCollapsed(false);
    }
  }, [location.pathname]);

  const handleNavigate = (path) => {
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  const isActive = (path) => location.pathname === path;

  const NavItem = ({ icon: Icon, label, path }) => {
    const active = isActive(path);

    return (
      <button
        onClick={() => handleNavigate(path)}
        className={`group relative flex items-center w-full px-3 py-2.5 rounded-md
        overflow-hidden transition-all duration-500 ease-in-out
        ${active
            ? "bg-[#0f1b2e] text-white"
            : "text-gray-400 hover:bg-[#0b1220] hover:text-white"
          }`}
      >
        {/* ACTIVE BORDER */}
        {active && (
          <span className="absolute left-0 top-0 h-full w-[5px] bg-blue-600 rounded-r-md" />
        )}

        {/* ICON */}
        <div
          className={`flex items-center justify-center shrink-0 transition-all duration-500
          ${collapsed ? "w-full" : "mr-3"}`}
        >
          <Icon
            size={20}
            className={`transition-all duration-500 ${active ? "scale-110 text-white" : ""
              }`}
          />
        </div>

        {/* LABEL */}
        <span
          className={`whitespace-nowrap overflow-hidden transition-all duration-500 ease-in-out
          ${collapsed
              ? "max-w-0 opacity-0 translate-x-[-10px]"
              : "max-w-[200px] opacity-100 translate-x-0"
            }`}
        >
          {label}
        </span>
      </button>
    );
  };

  return (
    <div
      className={`${collapsed ? "w-[100px]" : "w-[260px]"
        }
      bg-[#050B18]
      flex flex-col justify-between
      px-5 py-6
      border-r border-[#1f2a44]
      transition-all duration-500 ease-in-out`}
    >
      {/* TOP */}
      <div>
        {/* LOGO + TOGGLE */}
        <div
          className={`flex items-center ${collapsed ? "justify-center" : "justify-between"
            } mb-10 transition-all duration-500`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {/* LOGO ICON */}
            <div className="bg-blue-600 p-2 rounded-md text-white transition-all duration-500">
              <Code2 size={18} />
            </div>

            {/* LOGO TEXT */}
            <div
              className={`overflow-hidden transition-all duration-500
              ${collapsed
                  ? "max-w-0 opacity-0"
                  : "max-w-[200px] opacity-100"
                }`}
            >
              <span className="font-semibold text-lg text-white">
                DevCollab
              </span>

              <div className="text-xs text-gray-400">
                Developer Workplace
              </div>
            </div>
          </div>

          {/* TOGGLE BUTTON */}
          {!collapsed ? (
            <button
              onClick={() => setCollapsed(true)}
              className="text-gray-400 hover:text-white transition-all duration-300"
            >
              <Menu size={20} />
            </button>
          ) : (
            <button
              onClick={() => setCollapsed(false)}
              className="text-gray-400 hover:text-white transition-all duration-300"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* MAIN NAV */}
        <div className="space-y-1">
          <NavItem
            icon={LayoutDashboard}
            label="Overview"
            path="/dashboard"
          />

          <NavItem
            icon={FileText}
            label="Reports"
            path="/report"
          />

          <NavItem
            icon={Folder}
            label="Projects"
            path="/project"
          />

          <NavItem
            icon={Users}
            label="Chat"
            path="/chat"
          />

          <NavItem
            icon={Bot}
            label="AI Assistant"
            path="/AIAssistant"
          />
        </div>

        {/* DIVIDER */}
        <div className="border-t border-[#1f2a44] my-6" />

        {/* SUPPORT */}
        <div className="space-y-1">
          <NavItem
            icon={Settings}
            label="Settings"
            path="/settings"
          />

          <NavItem
            icon={HelpCircle}
            label="Help Center"
            path="/help"
          />
        </div>
      </div>

      {/* BOTTOM */}
      <div className="pt-4 border-t border-[#1f2a44]">
        <Logout collapsed={collapsed} />
      </div>
    </div>
  );
}