import React from "react";
import {
  Files,
  Search,
  GitBranch,
  Play,
  LayoutGrid,
  Bot,
  FlaskConical,
  Settings
} from "lucide-react";
import Logout from "../../../component/Logout";

export default function ActivityBar({ activeView, setActiveView }) {
  const navItems = [
    { id: "explorer", label: "Explorer", icon: Files },
    { id: "search", label: "Search", icon: Search },
    { id: "sourceControl", label: "Source Control", icon: GitBranch },
    { id: "debug", label: "Run & Debug", icon: Play },
    { id: "extensions", label: "Extensions", icon: LayoutGrid },
    { id: "aiAgent", label: "AI Agent", icon: Bot },
    { id: "testing", label: "Testing", icon: FlaskConical },
  ];

  return (
    <aside className="w-12 bg-[#0B111B] border-r border-[#1E293B] flex flex-col items-center py-2 select-none shrink-0 z-20 font-sans">
      {/* Top Nav Items with Icon + Small Label */}
      <div className="flex flex-col gap-1 w-full flex-1 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(isActive ? null : item.id)}
              title={item.label}
              className={`relative w-full py-2.5 flex flex-col items-center justify-center gap-1 transition-all group ${isActive
                  ? "bg-[#18233A] text-[#3794FF]"
                  : "text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#151E2D]"
                }`}
            >
              {/* Left active vertical indicator line */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#3794FF]" />
              )}
              <Icon
                size={18}
                strokeWidth={1.75}
                className={isActive ? "text-[#3794FF]" : "text-[#8B949E] group-hover:text-[#E6EDF3] transition-colors"}
              />
              <span className={`text-[9px] font-medium leading-none tracking-tight text-center px-0.5 ${isActive ? "text-[#3794FF]" : "text-[#6E7681] group-hover:text-[#8B949E]"
                }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Area: Settings & Logout */}
      <div className="w-full flex flex-col items-center pb-2 pt-1 border-t border-[#1E293B]/50 gap-0.5">
        <button
          onClick={() => setActiveView(activeView === "settings" ? null : "settings")}
          title="Settings"
          className={`relative w-full py-2 flex flex-col items-center justify-center gap-1 transition-all group ${
            activeView === "settings"
              ? "bg-[#18233A] text-[#3794FF]"
              : "text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#151E2D]"
          }`}
        >
          {activeView === "settings" && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#3794FF]" />
          )}
          <Settings size={18} strokeWidth={1.75} />
          <span className="text-[9px] font-medium leading-none tracking-tight text-center text-[#6E7681] group-hover:text-[#8B949E]">
            Settings
          </span>
          {/* Notification badge */}
          <span className="absolute top-1 right-2 w-3.5 h-3.5 rounded-full bg-[#3794FF] text-white text-[8px] font-bold flex items-center justify-center">
            2
          </span>
        </button>

        {/* Real functional Logout button with icon and label */}
        <Logout variant="activitybar" />
      </div>
    </aside>
  );
}
