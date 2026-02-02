import React, { use } from "react";
import { CiMenuFries } from "react-icons/ci";
import useConversation from "../../zustand/useConversation.js";
import { useNavigate } from "react-router-dom";
import { useSocketContext } from "../../context/SocketContext.jsx";
export default function ChatUser() {
  const navigate = useNavigate();
  const {selectedConversation} = useConversation();
 const { onlineUsers } = useSocketContext();
  const getOnlineUsersStatus = (userId) => {
    return onlineUsers.includes(userId) ? "Online" : "Offline";
  };

  return (
  <div className="relative flex items-center h-[8%] justify-center gap-4 bg-slate-800 hover:bg-slate-700 duration-300 rounded-md">
<label 
  className="btn btn-ghost drawer-button lg:hidden absolute left-5"
  onClick={() => navigate(-1)} 
>
  <CiMenuFries className="text-white text-xl" />
</label>


  <div className="flex space-x-3 items-center justify-center h-[8vh] bg-gray-800 hover:bg-gray-700 duration-300 rounded-md p-2">
    <div className="avatar online">
      <div className="w-16 rounded-full overflow-hidden">
       
      </div>
    </div>
    <div>
      <h1 className="text- text-white">{selectedConversation?.fullName}</h1>
     <span className="text-sm">
            {getOnlineUsersStatus(selectedConversation._id)}
          </span>
    </div>
  </div>
</div>

  );
}
