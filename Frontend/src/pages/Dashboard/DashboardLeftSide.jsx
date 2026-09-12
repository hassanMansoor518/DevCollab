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
  PanelLeftClose,
  PanelLeft
} from "lucide-react";

export default function DashboardLeftSide() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isUserCollapsed, setIsUserCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved !== null ? JSON.parse(saved) : window.innerWidth < 768;
  });

  const [collapsed, setCollapsed] = useState(() => {
    const isAutoClosePage = location.pathname.includes("/chat") || location.pathname.includes("/settings");
    if (isAutoClosePage || window.innerWidth < 768) return true;
    return isUserCollapsed;
  });

  const handleToggleState = (newState) => {
    setCollapsed(newState);
    setIsUserCollapsed(newState);
    localStorage.setItem("sidebar_collapsed", JSON.stringify(newState));
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } else {
        const isAutoClosePage = location.pathname.includes("/chat") || location.pathname.includes("/settings");
        if (!isAutoClosePage) {
          setCollapsed(isUserCollapsed);
        }
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [location.pathname, isUserCollapsed]);

  useEffect(() => {
    const isAutoClosePage = location.pathname.includes("/chat") || location.pathname.includes("/settings");
    if (isAutoClosePage) {
      setCollapsed(true);
    } else if (window.innerWidth < 768) {
      setCollapsed(true);
    } else {
      setCollapsed(isUserCollapsed);
    }
  }, [location.pathname, isUserCollapsed]);

  useEffect(() => {
    const handleToggleEvent = () => handleToggleState(!collapsed);
    window.addEventListener("toggle-sidebar", handleToggleEvent);
    return () => window.removeEventListener("toggle-sidebar", handleToggleEvent);
  }, [collapsed]);

  const handleNavigate = (path) => {
    if (location.pathname !== path) navigate(path);
    if (window.innerWidth < 768) {
      setCollapsed(true);
    }
  };

  const isActive = (path) => {
    if (path === "/dashboard" && location.pathname === "/dashboard") return true;
    if (path !== "/dashboard" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const NavItem = ({ icon: Icon, label, path }) => {
    const active = isActive(path);

    return (
      <button
        onClick={() => handleNavigate(path)}
        title={collapsed ? label : undefined}
        className={`group relative flex items-center w-full rounded transition-all duration-150 select-none ${collapsed ? "h-9 justify-center px-0" : "h-9 px-2.5 gap-2.5"
          } ${active
            ? "bg-[#18233A] text-[#3794FF] font-medium"
            : "text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#151E2D]"
          }`}
      >
        {/* Left vertical active bar */}
        {active && (
          <span className="absolute left-0 top-1 bottom-1 w-[2px] bg-[#3794FF] rounded-r" />
        )}

        {/* Icon */}
        <Icon
          size={16}
          strokeWidth={1.75}
          className={`shrink-0 transition-colors ${active ? "text-[#3794FF]" : "text-[#8B949E] group-hover:text-[#E6EDF3]"
            }`}
        />

        {/* Label (visible when expanded) */}
        {!collapsed && (
          <span className="text-xs truncate tracking-tight">
            {label}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {!collapsed && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
          onClick={() => handleToggleState(true)}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed md:relative z-50 h-full bg-[#0B111B] border-r border-[#1E293B] flex flex-col justify-between py-3 select-none transition-all duration-200 shrink-0 font-sans ${collapsed ? "w-[56px] px-1.5" : "w-[210px] px-2.5"
          }`}
      >
        {/* Top Header & Navigation */}
        <div className="flex flex-col">
          {/* Brand Header */}
          <div
            className={`flex items-center h-9 mb-4 border-b border-[#172033] pb-2 ${collapsed ? "justify-center px-0" : "justify-between px-1"
              }`}
          >
            {/* Brand Logo & Name */}
            <div
              onClick={() => handleNavigate("/dashboard")}
              className="flex items-center gap-2 cursor-pointer group truncate"
            >
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Code2 size={14} strokeWidth={2.5} />
              </div>

              {!collapsed && (
                <div className="truncate">
                  <span className="font-bold text-xs text-[#E6EDF3] tracking-tight block leading-tight">
                    DevCollab
                  </span>
                  <span className="text-[10px] text-[#6E7681] block leading-none font-mono">
                    Workspace
                  </span>
                </div>
              )}
            </div>

            {/* Collapse / Expand Toggle Button */}
            {!collapsed && (
              <button
                onClick={() => handleToggleState(true)}
                className="p-1 text-[#6E7681] hover:text-[#E6EDF3] hover:bg-[#151E2D] rounded transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeftClose size={15} />
              </button>
            )}
          </div>

          {/* Expand Button when collapsed */}
          {collapsed && (
            <div className="flex justify-center mb-2">
              <button
                onClick={() => handleToggleState(false)}
                className="p-1 text-[#6E7681] hover:text-[#E6EDF3] hover:bg-[#151E2D] rounded transition-colors"
                title="Expand sidebar"
              >
                <PanelLeft size={15} />
              </button>
            </div>
          )}

          {/* Main Navigation Items */}
          <div className="space-y-0.5">
            {!collapsed && (
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6E7681]">
                Workspace
              </div>
            )}
            <NavItem icon={LayoutDashboard} label="Overview" path="/dashboard" />
            <NavItem icon={Folder} label="Projects" path="/project" />
            <NavItem icon={FileText} label="Reports" path="/report" />
            <NavItem icon={Users} label="Team Chat" path="/chat" />
            <NavItem icon={Bot} label="AI Assistant" path="/AIAssistant" />
          </div>

          {/* Divider */}
          <div className="border-t border-[#172033] my-3" />

          {/* Support / Secondary Navigation */}
          <div className="space-y-0.5">
            {!collapsed && (
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6E7681]">
                System
              </div>
            )}
            <NavItem icon={Settings} label="Settings" path="/settings" />
            <NavItem icon={HelpCircle} label="Help Center" path="/help" />
          </div>
        </div>

        {/* Bottom Profile / Logout */}
        <div className="pt-2 border-t border-[#172033]">
          <Logout collapsed={collapsed} />
        </div>
      </aside>
    </>
  );
}