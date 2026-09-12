import React, { useState } from "react";
import {
  Code2,
  Lock,
  GitCommit,
  GitPullRequest,
  Users,
  Settings,
  GitBranch,
  ChevronDown,
  Download,
  Upload,
  ChevronRight,
  FlaskConical
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TopHeader({
  projectName = "devcollab-webapp",
  branch = "main",
  commitsCount = 12,
  pullCount = 3,
  memberCount = 5,
  activeTab = "code",
  onTabChange,
  user,
  onPullLatest,
  onPush,
  isPushing = false
}) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  // Retrieve current user from props or localStorage
  const authUser = JSON.parse(localStorage.getItem("ChatApp") || "{}");
  const currentUser = user || authUser?.user || authUser;

  // Real user avatar extraction with robust fallbacks
  const explicitAvatar =
    currentUser?.avatar ||
    currentUser?.profilePic ||
    currentUser?.image ||
    currentUser?.avatarUrl;

  const userName = currentUser?.fullName || currentUser?.name || currentUser?.username || "Developer";
  const userEmail = currentUser?.email || "";

  // Real developer avatar fallback using Dicebear
  const fallbackAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}&backgroundColor=0d1522`;
  const activeAvatarSrc = !imageError && explicitAvatar ? explicitAvatar : fallbackAvatar;

  const navTabs = [
    { id: "commits", label: "Commits", icon: GitCommit, badge: commitsCount },
    { id: "prs", label: "Pull Requests", icon: GitPullRequest, badge: pullCount },
    { id: "code", label: "Code View", icon: Code2 },
    { id: "members", label: "Members", icon: Users, badge: memberCount },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="h-14 bg-[#0B111B] border-b border-[#1E293B] px-5 flex items-center justify-between select-none shrink-0 z-30 font-sans">
      {/* LEFT SECTION */}
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Brand Logo & Name — visible on Code View & Testing tabs */}
        {(activeTab === "code" || activeTab === "testing") && (
          <>
            <div
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity shrink-0"
            >
              <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-xs">
                <Code2 size={16} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-sm tracking-tight text-[#E6EDF3]">
                DevCollab
              </span>
            </div>

            {/* Separator */}
            <div className="w-[1px] h-5 bg-[#1E293B]" />
          </>
        )}

        {/* Projects Breadcrumb */}
        <div className="flex items-center gap-1 text-[#8B949E] text-xs truncate">
          <span
            onClick={() => navigate("/project")}
            className="hover:text-[#E6EDF3] cursor-pointer transition-colors"
          >
            Projects
          </span>
          <ChevronRight size={13} className="text-[#6E7681]" />
          <span className="text-[#E6EDF3] font-medium truncate">
            {projectName}
          </span>
        </div>

        {/* Private Badge */}
        <div className="hidden sm:flex items-center gap-1 bg-[#151E2D] border border-[#1E293B] text-[#8B949E] text-[11px] px-2.5 py-0.5 rounded font-medium">
          <Lock size={11} className="text-[#6E7681]" />
          <span>Private</span>
        </div>
      </div>

      {/* CENTER / NAVIGATION TABS */}
      <nav className="hidden lg:flex items-center gap-1">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange ? onTabChange(tab.id) : null}
              className={`flex h-7 items-center gap-1.5 px-2.5 rounded text-[11px] font-medium transition-all whitespace-nowrap shrink-0 ${isActive
                ? "bg-[#18233A] text-[#3794FF] border border-[#3794FF]/40 shadow-xs"
                : "text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#151E2D]"
                }`}
            >
              <Icon size={12} className={isActive ? "text-[#3794FF]" : "text-[#8B949E]"} />
              <span className="whitespace-nowrap text-xs">{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono leading-none shrink-0 ${isActive ? "bg-[#3794FF]/20 text-[#3794FF]" : "bg-[#172033] text-[#8B949E]"
                  }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* RIGHT SECTION: Controls & Avatar */}
      <div className="flex items-center gap-2.5 shrink-0">

        {/* Branch Selector */}
        <button
          className="flex h-8 items-center gap-1.5 bg-[#0D1522] hover:bg-[#151E2D] border border-[#1E293B] text-[#E6EDF3] px-3 rounded text-xs transition-colors"
          title="Switch Branch"
        >
          <GitBranch size={13} className="text-[#3794FF]" />
          <span className="font-mono text-[11px] font-medium">{branch}</span>
          <ChevronDown size={12} className="text-[#6E7681]" />
        </button>

        {/* Pull Latest Button */}
        <button
          onClick={onPullLatest}
          className="flex h-8 items-center gap-1.5 bg-[#0D1522] hover:bg-[#151E2D] border border-[#1E293B] text-[#E6EDF3] px-3 rounded text-[11px] font-medium transition-colors"
          title="Pull Latest from Remote"
        >
          <Download size={12} className="text-[#8B949E]" />
          <span className="hidden sm:inline">Pull Latest</span>
        </button>

        {/* Push Button */}
        <button
          onClick={onPush}
          disabled={isPushing}
          className="flex h-8 items-center gap-1.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-3.5 rounded text-xs font-medium shadow-xs transition-all disabled:opacity-50"
          title="Push to GitHub"
        >
          <Upload size={13} />
          <span>{isPushing ? "Pushing..." : "Push"}</span>
        </button>

        {/* User Profile */}
        <div className="relative ml-1 shrink-0">
          <div
            title={`${userName}${userEmail ? ` (${userEmail})` : ""}`}
            onClick={() => navigate("/settings")}
            className="w-8 h-8 rounded-full overflow-hidden border border-[#1E293B] hover:border-[#3794FF] bg-[#151E2D] flex items-center justify-center cursor-pointer transition-all duration-200 shadow-xs group"
          >
            <img
              src={activeAvatarSrc}
              alt={userName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={() => setImageError(true)}
            />
          </div>

          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#3FB950] ring-2 ring-[#0B111B]" />
        </div>

      </div>
    </header>
  );
}
