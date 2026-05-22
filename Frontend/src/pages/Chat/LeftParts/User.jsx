import React from "react";
import useConversation from "../../../zustand/useConversation.js";
import { useSocketContext } from "../../../context/SocketContext.jsx";

import profile from "../../../assets/Profile.png";

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
            className={`
      flex items-center gap-3
      px-4 py-2 mx-2 rounded-lg
      cursor-pointer
      transition-all duration-200
      ${isSelected
                    ? "bg-[#1e293b] text-white"
                    : "hover:bg-[#111827]"
                }
    `}
        >
            {/* Avatar */}
            <div className="relative">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                    <img
                        src={profile}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                </div>

                <span
                    className={`
          absolute bottom-0 right-0
          w-2.5 h-2.5 rounded-full
          border-2 border-[#0b1120]
          ${isOnline ? "bg-green-400" : "bg-gray-500"}
        `}
                />
            </div>

            {/* Name */}
            <p className="text-sm font-medium truncate">
                {user.fullName}
            </p>
        </div>
    );

}

export default User;
