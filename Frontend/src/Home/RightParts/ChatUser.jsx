import React from "react";
import { CiMenuFries } from "react-icons/ci";
import { useNavigate } from "react-router-dom";
import useConversation from "../../zustand/useConversation.js";
import { useSocketContext } from "../../context/SocketContext.jsx";

export default function ChatUser() {
  const navigate = useNavigate();
  const { selectedConversation } = useConversation();
  const { onlineUsers } = useSocketContext();

  if (!selectedConversation) return null;

  const isOnline = onlineUsers.includes(selectedConversation._id);

  return (
    <div className="relative flex items-center h-[8%] justify-center gap-4 bg-slate-800 hover:bg-slate-700 duration-300 rounded-md">
      
      {/* Mobile Back Button */}
      <button
        className="btn btn-ghost drawer-button lg:hidden absolute left-5"
        onClick={() => navigate(-1)}
      >
        <CiMenuFries className="text-white text-xl" />
      </button>

      {/* User Info */}
      <div className="flex space-x-3 items-center justify-center h-[8vh] bg-gray-800 hover:bg-gray-700 duration-300 rounded-md p-2">
        
        {/* Avatar */}
        <div className={`avatar ${isOnline ? "online" : "offline"}`}>
          <div className="w-16 rounded-full overflow-hidden bg-gray-600">
            {/* Image can go here */}
          </div>
        </div>

        {/* Name & Status */}
        <div>
          <h1 className="text-white font-medium">
            {selectedConversation.fullName}
          </h1>

          <span
            className={`text-sm ${
              isOnline ? "text-green-400" : "text-gray-400"
            }`}
          >
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>
    </div>
  );
}
