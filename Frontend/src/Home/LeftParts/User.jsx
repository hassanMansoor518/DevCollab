import React from "react";
import useConversation from "../../zustand/useConversation.js";
import { useSocketContext } from "../../context/SocketContext.jsx";
import profile from "../../assets/Profile.png";

function User({ user }) {
  const { selectedConversation, setSelectedConversation } = useConversation();
  const isSelected = selectedConversation?._id === user._id;
  const { onlineUsers } = useSocketContext();
  const isOnline = onlineUsers.includes(user._id);

  const handleClick = async () => {
    try {
      // request or create conversation between auth user and this user
      const res = await fetch(`/api/conversation/get-or-create/${user._id}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to get/create conversation');
      const conversation = await res.json();
      setSelectedConversation(conversation);
    } catch (err) {
      console.error('Error in getting/creating conversation', err);
    }
  };

  return (
    <div
      className={`hover:bg-slate-600 duration-300 ${
        isSelected ? "bg-slate-700" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex space-x-4 px-8 py-3 hover:bg-slate-700 duration-300 cursor-pointer items-center">
        {/* Avatar with online/offline dot */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden">
            <img src={profile} alt="Profile" className="w-full h-full object-cover" />
          </div>
          {/* Online/Offline dot */}
          <span
            className={`absolute bottom-0 right-0 block w-3 h-3 rounded-full border-2 border-slate-900 ${
              isOnline ? "bg-green-500" : "bg-gray-400"
            }`}
          ></span>
        </div>

        {/* User info */}
        <div>
          <h1 className="font-bold">{user.fullName}</h1>
          <span className="text-sm text-gray-300">{user.email}</span>
        </div>
      </div>
    </div>
  );
}

export default User;



