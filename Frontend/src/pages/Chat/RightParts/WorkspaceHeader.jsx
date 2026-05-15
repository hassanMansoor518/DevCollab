import React, { useState } from "react";

function WorkspaceHeader({ workspace }) {
  const [showMembers, setShowMembers] = useState(false);

  if (!workspace) return null;

  return (
    <>
      {/* Header Bar */}
      <div
        className="relative flex items-center h-[65px] justify-center gap-4 px-6 bg-[#0b1120] border-b border-[#1f2937] cursor-pointer hover:bg-[#0f1929] transition"
        onClick={() => setShowMembers(true)} // ✅ open on click
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#1e293b] text-gray-400 font-bold text-xl">
            #
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-200 tracking-wide">
              {workspace.name}
            </h1>
            <span className="text-xs text-gray-500">
              {workspace.members?.length} members · click to view
            </span>
          </div>
        </div>
      </div>

      {/* Members Modal */}
      {showMembers && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowMembers(false)} // ✅ close on outside click
        >
          <div
            className="bg-[#0f172a] border border-[#1f2937] rounded-2xl w-full max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()} // ✅ prevent close when clicking inside
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2937]">
              <div>
                <h2 className="text-base font-semibold text-gray-100">
                  {workspace.name}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {workspace.members?.length} members
                </p>
              </div>
              <button
                onClick={() => setShowMembers(false)}
                className="text-gray-500 hover:text-gray-200 text-xl transition"
              >
                ✕
              </button>
            </div>

            {/* Members List */}
            <div className="px-4 py-3 max-h-[60vh] overflow-y-auto">
              {workspace.members?.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-6">
                  No members found
                </p>
              )}
              {workspace.members?.map((member, idx) => {
                const name = member?.fullName || member?.email || "Unknown";
                const initial = name.charAt(0).toUpperCase();

                return (
                  <div
                    key={member._id || idx}
                    className="flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-[#1e293b] transition"
                  >
                    {/* Avatar with initial */}
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {initial}
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-200">
                        {name}
                      </span>
                      {member?.email && (
                        <span className="text-xs text-gray-500">
                          {member.email}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#1f2937]">
              <button
                onClick={() => setShowMembers(false)}
                className="w-full py-2 rounded-xl bg-[#1e293b] text-gray-300 hover:bg-[#273548] transition text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default WorkspaceHeader;