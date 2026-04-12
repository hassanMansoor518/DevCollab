import React from "react";

function WorkspaceHeader({ workspace }) {
  if (!workspace) return null;

  return (
    <div className="relative flex items-center h-[65px] justify-center gap-4 px-6 bg-[#0b1120] border-b border-[#1f2937]">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#1e293b] text-gray-400 font-bold">
          #
        </div>

        <div>
          <h1 className="text-base font-semibold text-gray-200 tracking-wide">
            {workspace.name}
          </h1>
          <span className="text-xs text-gray-500">
            {workspace.members?.length} members
          </span>
        </div>
      </div>
    </div>
  );
}

export default WorkspaceHeader;