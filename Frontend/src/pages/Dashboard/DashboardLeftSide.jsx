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

  const [collapsed, setCollapsed] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (location.pathname === "/chat" && window.innerWidth >= 768) {
      setCollapsed(false);
    } else if (window.innerWidth < 768) {
      setCollapsed(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleToggle = () => setCollapsed(prev => !prev);
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  const handleNavigate = (path) => {
    if (location.pathname !== path) navigate(path);
    if (window.innerWidth < 768) {
      setCollapsed(true);
    }
  };

  const isActive = (path) => location.pathname === path;

  const NavItem = ({ icon: Icon, label, path }) => {
    const active = isActive(path);

    return (
      <button
        onClick={() => handleNavigate(path)}
        className={`
          group relative flex items-center w-full px-3 py-2.5 rounded-md
          transition-all duration-300 ease-in-out

          ${active
            ? "bg-surface text-text-primary shadow-sm"
            : "text-text-secondary hover:text-text-primary hover:bg-hover-bg"
          }
        `}
      >
        {/* ACTIVE BAR */}
        {active && (
          <span className="absolute left-0 top-0 h-full w-[4px] bg-primary rounded-r-md" />
        )}

        {/* ICON */}
        <div
          className={`flex items-center justify-center shrink-0 transition-all duration-300 ${collapsed ? "w-full" : "mr-3"
            }`}
        >
          <Icon
            size={20}
            className={`
              transition-all duration-300
              ${active
                ? "text-primary"
                : "text-text-muted group-hover:text-text-primary"
              }
            `}
          />
        </div>

        {/* LABEL */}
        <span
          className={`
            whitespace-nowrap overflow-hidden transition-all duration-300
            ${collapsed
              ? "max-w-0 opacity-0 -translate-x-2"
              : "max-w-[200px] opacity-100 translate-x-0"
            }
          `}
        >
          {label}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* MOBILE OVERLAY */}
      {!collapsed && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setCollapsed(true)}
        />
      )}



      <div
        className={`
          fixed md:relative z-50 h-full
          ${collapsed ? "-translate-x-full md:translate-x-0 md:w-[100px]" : "translate-x-0 w-[260px]"}
          bg-background
          flex flex-col justify-between
          px-5 py-6
          border-r border-border-default
          transition-all duration-300 ease-in-out
        `}
      >
      {/* TOP */}
      <div>
        {/* LOGO + TOGGLE */}
        <div
          className={`flex items-center ${collapsed ? "justify-center" : "justify-between"
            } mb-10`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="bg-primary p-2 rounded-md text-white">
              <Code2 size={18} />
            </div>

            <div
              className={`transition-all duration-300 overflow-hidden ${collapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"
                }`}
            >
              <span className="font-semibold text-lg text-text-primary">
                DevCollab
              </span>
              <div className="text-xs text-text-muted">
                Developer Workplace
              </div>
            </div>
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-text-muted hover:text-text-primary transition"
          >
            {collapsed ? (
              <ChevronRight size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>
        </div>

        {/* NAV */}
        <div className="space-y-1">
          <NavItem icon={LayoutDashboard} label="Overview" path="/dashboard" />
          <NavItem icon={FileText} label="Reports" path="/report" />
          <NavItem icon={Folder} label="Projects" path="/project" />
          <NavItem icon={Users} label="Chat" path="/chat" />
          <NavItem icon={Bot} label="AI Assistant" path="/AIAssistant" />
        </div>

        {/* DIVIDER */}
        <div className="border-t border-border-subtle my-6" />

        {/* SUPPORT */}
        <div className="space-y-1">
          <NavItem icon={Settings} label="Settings" path="/settings" />
          <NavItem icon={HelpCircle} label="Help Center" path="/help" />
        </div>
      </div>

      {/* BOTTOM */}
      <div className="pt-4 border-t border-border-subtle">
        <Logout collapsed={collapsed} />
      </div>
    </div>
    </>
  );
}