import React, { useState } from "react";
import SearchBar from "./Search";
import Users from "./Users";

import Workspaces from "./Workspaces";
import { FiPlus } from "react-icons/fi";

export default function Left() {
  // Track which workspace is currently active
  const [activeWorkspace, setActiveWorkspace] = useState(null);

  return (
    <div className="
      flex flex-col justify-between
      h-screen
      w-[260px]
      bg-gradient-to-b from-[#0b1120] to-[#070d19]
      border-r border-[#1f2937]
      text-gray-300
    ">
      {/* TOP SECTION */}
      <div>
        {/* Workspace Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f2937]">
          <h1 className="text-sm font-semibold text-white tracking-wide">
            Dev Workspace
          </h1>

          <div className="w-7 h-7 rounded-md bg-[#1e293b] hover:bg-[#2563eb] 
                          flex items-center justify-center cursor-pointer 
                          transition duration-200">
            <FiPlus size={14} />
          </div>
        </div>

        {/* Search */}
        <div className="mt-3">
          <SearchBar placeholder="Search..." />
        </div>

        {/* Workspaces */}
        <Workspaces
          onSelectWorkspace={setActiveWorkspace}
          activeWorkspace={activeWorkspace}
        />

        {/* Users / Channels */}
        <Users workspace={activeWorkspace} />
      </div>


    </div>
  );
}