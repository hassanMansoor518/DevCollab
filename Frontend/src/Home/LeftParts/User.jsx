import React from "react";
import useConversation from "../../zustand/useConversation.js";
import { useSocketContext } from "../../context/SocketContext.jsx";

import profile from "../../assets/Profile.png";

function User({ user }) {
  const { selectedConversation, setSelectedConversation } = useConversation();
  const { onlineUsers } = useSocketContext();

  
  if (!user) return null;
  const isSelected = selectedConversation?._id === user._id;
  const isOnline = onlineUsers.includes(user._id);

  const handleClick = async () => {
    if (!user?._id) return;

    try {
      const res = await fetch(`/api/conversation/get-or-create/${user._id}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        console.error('get-or-create response:', res.status, text);
        throw new Error(`Failed to get/create conversation (${res.status})`);
      }

      const conversation = await res.json();
      setSelectedConversation(conversation);
  
    } catch (err) {
      console.error("Error getting/creating conversation:", err);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer hover:bg-slate-600 duration-300 ${isSelected ? "bg-slate-700" : ""
        }`}
    >
      <div className="flex space-x-4 px-8 py-3 items-center">

        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden">
            <img
              src={profile}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Online Indicator */}
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${isOnline ? "bg-green-500" : "bg-gray-400"
              }`}
          />
        </div>

        {/* User Info */}
        <div>
          <h1 className="font-bold text-white">{user.fullName}</h1>
          <span className="text-sm text-gray-300">{user.email}</span>
        </div>
      </div>
    </div>
  );
}

export default User;

