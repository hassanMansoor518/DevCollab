import React, { useState } from "react";
import { FiX, FiUserPlus } from "react-icons/fi";

export default function InviteModal({ users, onClose, onInvite }) {
  const [selectedUsers, setSelectedUsers] = useState([]);

  const toggleSelect = (user) => {
    if (selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const sendInvites = () => {
    selectedUsers.forEach(user => onInvite(user));
    setSelectedUsers([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1F2937] w-[420px] rounded-2xl shadow-2xl p-6 relative border border-gray-700">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <FiX size={18} />
        </button>

        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2 text-white">
          <FiUserPlus /> Invite Member
        </h2>

        <div className="space-y-3 max-h-60 overflow-y-auto">
          {users.map(user => {
            const isSelected = selectedUsers.find(u => u._id === user._id);
            return (
              <div
                key={user._id}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-700 transition"
              >
                <div className="flex items-center gap-3">
                  <img src={`https://i.pravatar.cc/40?u=${user._id}`} className="w-9 h-9 rounded-full" alt={user.fullName} />
                  <div>
                    <p className="text-white text-sm">{user.fullName}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleSelect(user)}
                  className={`px-3 py-1 rounded text-sm ${isSelected ? "bg-blue-500 text-white" : "text-blue-500 hover:text-white"}`}
                >
                  {isSelected ? "Selected" : "+"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">Cancel</button>
          <button onClick={sendInvites} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium">Send Invite</button>
        </div>
      </div>
    </div>
  );
}
