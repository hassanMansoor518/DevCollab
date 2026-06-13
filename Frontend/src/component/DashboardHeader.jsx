import React from "react";
import { Search, Menu } from "lucide-react";
import Notification from "./Notification";
import ThemeToggle from "./ThemeToggle.jsx";

export default function DashboardHeader({ user }) {
  return (
    <>
      {/* TOP BAR */}
      <div className="flex flex-row items-center justify-between gap-3 sm:gap-4 mb-8 w-full">

        <div className="flex flex-1 sm:flex-none sm:w-1/2 items-center gap-2 sm:gap-3 min-w-0">
          {/* MOBILE TOGGLE BUTTON */}
          <button
            className="md:hidden p-2 text-text-muted hover:text-text-primary hover:bg-hover-bg rounded-lg transition shrink-0 border border-border-default bg-surface shadow-sm sm:shadow-none"
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
          >
            <Menu size={20} />
          </button>

          {/* SEARCH */}
          <div className="relative w-full hidden sm:block">
            <Search className="absolute left-3 top-2.5 sm:top-3 w-4 h-4 text-text-muted" />

            <input
              className="
                w-full
                bg-surface
                border border-border-default
                rounded-lg
                pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm
                text-text-primary
                placeholder:text-text-muted
                outline-none
                transition
                focus:border-primary
                focus:ring-2
                focus:ring-primary/20
              "
              placeholder="Search projects..."
            />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-end gap-3 sm:gap-6 shrink-0">
          <ThemeToggle />

          {/* STATUS BADGE */}
          <div className="hidden lg:flex items-center">
            <div className="badge badge-success px-3 py-1.5 rounded-full whitespace-nowrap">
              <span className="mr-1">●</span> GITHUB CONNECTED
            </div>
          </div>

          {/* NOTIFICATION */}
          <Notification currentUserId={user?._id} />

          {/* USER INFO */}
          <div className="flex items-center gap-2 sm:gap-3 pl-3 sm:pl-4 border-l border-border-subtle shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-text-primary whitespace-nowrap">
                {user?.fullName}
              </p>
              <p className="text-xs text-text-muted whitespace-nowrap">
                {user?.email || "Member"}
              </p>
            </div>

            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold bg-primary-soft text-primary shrink-0 shadow-sm sm:shadow-none sm:border-0 border border-primary/10">
              {user?.fullName?.[0]?.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}