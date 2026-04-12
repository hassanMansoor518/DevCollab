import React from "react";
import useConversation from "../../../zustand/useConversation.js";
import { useSocketContext } from "../../../context/SocketContext.jsx";
import { CiMenuFries } from "react-icons/ci";
import profile from "../../../assets/Profile.png";

function Chatuser() {
  const { selectedConversation } = useConversation();
  const { onlineUsers } = useSocketContext();
  const authUser = JSON.parse(localStorage.getItem("ChatApp"));

  if (!selectedConversation) return null;

  const otherUser = selectedConversation.members.find(
    (member) => member._id !== authUser.user._id
  );

  const isOnline = onlineUsers.includes(otherUser?._id);

  return (
    <div className="relative flex items-center h-[65px] justify-center gap-4 px-6 bg-[#0b1120] border-b border-[#1f2937]">

      <label
        htmlFor="my-drawer-2"
        className="absolute left-6 lg:hidden text-gray-400 cursor-pointer"
      >
        <CiMenuFries className="text-lg" />
      </label>

      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border border-[#1f2937] overflow-hidden">
            <img
              src={profile}
              alt="profile"
              className="object-cover w-full h-full"
            />
          </div>

          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0b1120] ${
              isOnline ? "bg-green-400" : "bg-gray-500"
            }`}
          />
        </div>

        <div>
          <h1 className="text-base font-semibold text-gray-200 tracking-wide">
            {otherUser?.fullName}
          </h1>

          <span
            className={`text-xs ${
              isOnline ? "text-green-400" : "text-gray-500"
            }`}
          >
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Chatuser;
