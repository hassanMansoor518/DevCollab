import React from "react";
import { Search } from "lucide-react";
import Notification from "./Notification";
import ThemeToggle from "./ThemeToggle.jsx";

export default function DashboardHeader({ user }) {
  return (
    <>
      {/* TOP BAR */}
      <div className="flex items-center justify-between mb-8">

        {/* SEARCH */}
        <div className="flex items-center gap-6 w-1/2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 w-4 h-4 text-text-muted" />

            <input
              className="
                w-full
                bg-surface
                border border-border-default
                rounded-lg
                pl-10 pr-4 py-2 text-sm
                text-text-primary
                placeholder:text-text-muted
                outline-none
                transition
                focus:border-primary
                focus:ring-2
                focus:ring-primary/20
              "
              placeholder="Search projects, files or discussions..."
            />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-6">
          <ThemeToggle />
          
          {/* STATUS BADGE */}
          <div className="badge badge-success px-3 py-1.5 rounded-full">
            <span className="mr-1">●</span> GITHUB CONNECTED
          </div>

          {/* NOTIFICATION */}
          <Notification currentUserId={user?._id} />

          {/* USER INFO */}
          <div className="flex items-center gap-3 pl-4 border-l border-border-subtle">
            <div className="text-right">
              <p className="text-sm font-semibold text-text-primary">
                {user?.fullName}
              </p>
              <p className="text-xs text-text-muted">
                {user?.email || "Member"}
              </p>
            </div>

            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold bg-primary-soft text-primary">
              {user?.fullName?.[0]?.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}