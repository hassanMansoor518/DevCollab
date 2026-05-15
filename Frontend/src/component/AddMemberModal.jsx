import React, { useState } from "react";
import { X, Search, Plus } from "lucide-react";

export default function AddMemberModal({
  onClose,
  allUsers = [],
  onAddMembers,
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [role, setRole] = useState("Developer");

  // Filter users
  const filteredUsers = allUsers.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Toggle select
  const toggleUser = (user) => {
    const exists = selected.find((u) => u._id === user._id);
    if (exists) {
      setSelected((prev) => prev.filter((u) => u._id !== user._id));
    } else {
      setSelected((prev) => [...prev, user]);
    }
  };

  const handleSubmit = () => {
    const ids = selected.map((u) => u._id);
    onAddMembers(ids, role);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#0B1120] w-[420px] rounded-2xl border border-[#1C2333] shadow-2xl p-5">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-semibold text-lg">
            Add Member to Project
          </h2>
          <button onClick={onClose}>
            <X className="text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Search + Role */}
        <div className="flex gap-2 mb-4">
          <div className="flex items-center bg-[#111827] px-3 rounded-lg flex-1">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm px-2 py-2 w-full text-white"
            />
          </div>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-[#111827] text-sm text-white px-3 rounded-lg"
          >
            <option>Developer</option>
            <option>Admin</option>
            <option>Viewer</option>
          </select>
        </div>

        {/* Suggested Users */}
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2">
            SUGGESTED TEAM MEMBERS
          </p>

          <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
            {filteredUsers.map((user) => {
              const isSelected = selected.some(
                (u) => u._id === user._id
              );

              return (
                <div
                  key={user._id}
                  className="flex items-center justify-between bg-[#0f172a] px-3 py-2 rounded-lg hover:bg-[#1e293b] transition"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <p className="text-sm text-white">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={() => toggleUser(user)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                      isSelected
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-500"
                    }`}
                  >
                    <Plus
                      className={`w-4 h-4 ${
                        isSelected ? "text-white" : "text-gray-400"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={onClose}
            className="text-gray-400 text-sm hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm"
          >
            Send Invite →
          </button>
        </div>
      </div>
    </div>
  );
}