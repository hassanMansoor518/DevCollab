import React from "react";
import useConversation from "../../zustand/useConversation.js";
import { useSocketContext } from "../../context/SocketContext.jsx";
import { CiMenuFries } from "react-icons/ci";
import profile from "../../assets/Profile.png";

function Chatuser() {
  const { selectedConversation } = useConversation();
  const { onlineUsers } = useSocketContext();
  const authUser = JSON.parse(localStorage.getItem("ChatApp"));

  if (!selectedConversation) return null;

  // 🔥 find other user
  const otherUser = selectedConversation.members.find(
    (member) => member._id !== authUser.user._id
  );

  const isOnline = onlineUsers.includes(otherUser?._id);

  return (
    <div className="relative flex items-center h-[8%] justify-center gap-4 bg-slate-800 rounded-md">
      <label
        htmlFor="my-drawer-2"
        className="btn btn-ghost drawer-button lg:hidden absolute left-5"
      >
        <CiMenuFries className="text-white text-xl" />
      </label>

      <div className="flex space-x-3 items-center h-[8vh]">
        {/* avatar */}
        <div className={`avatar ${isOnline ? "online" : "offline"}`}>
          <div className="w-16 rounded-full">
            <img src={profile} alt="profile" />
          </div>
        </div>

        {/* name + status */}
        <div>
          <h1 className="text-xl text-white">{otherUser?.fullName}</h1>
          <span className={`text-sm ${isOnline ? "text-green-400" : "text-gray-400"}`}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Chatuser;

