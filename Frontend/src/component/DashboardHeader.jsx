import React from "react";
import { Search, Plus } from "lucide-react";
import Notification from "./Notification";

export default function DashboardHeader({
  user

}) {
  return (
    <>
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6 w-1/2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              className="w-full bg-[#0B1120] border border-[#1C2333] rounded-lg pl-10 pr-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="Search projects, files or discussions..."
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="bg-green-900/40 text-green-400 text-xs px-3 py-1 rounded-full border border-green-700">
            ● GITHUB CONNECTED
          </div>

          <Notification currentUserId={user?._id} />

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">{user?.fullName}</p>
              <p className="text-xs text-gray-400">Lead Developer</p>
            </div>
            <div className="w-8 h-8 bg-[#1E293B] rounded-lg flex items-center justify-center font-bold">
              {user?.fullName?.[0]}
            </div>
          </div>
        </div>
      </div>

      {/* Header Section */}

    </>
  );
}