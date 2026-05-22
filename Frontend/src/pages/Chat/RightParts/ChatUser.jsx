import React from "react";
import { Phone, Video, Search, Info, Settings, MoreVertical } from "lucide-react";
import useConversation from "../../../zustand/useConversation.js";
import { useSocketContext } from "../../../context/SocketContext.jsx";
import { CiMenuFries } from "react-icons/ci";
import profile from "../../../assets/Profile.png";

function Chatuser() {
    const { selectedConversation } = useConversation();
    const { onlineUsers } = useSocketContext();
    const authUser = JSON.parse(localStorage.getItem("ChatApp"));

    if (!selectedConversation) return null;

    const otherUser = selectedConversation.members?.find(
        (member) => (member._id || member).toString() !== authUser.user._id.toString()
    );

    const isOnline = onlineUsers.includes(otherUser?._id);
    const initial = otherUser?.fullName ? otherUser.fullName.charAt(0).toUpperCase() : "?";

    return (
        <div className="relative flex items-center justify-between h-[70px] px-6 bg-surface border-b border-border-subtle shadow-sm select-none z-10">
            {/* Mobile Drawer Trigger */}
            <label
                htmlFor="my-drawer-2"
                className="lg:hidden text-text-muted hover:text-text-primary cursor-pointer mr-4"
            >
                <CiMenuFries className="text-xl" />
            </label>

            {/* User Info (Left Side) */}
            <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-info flex items-center justify-center font-bold text-white overflow-hidden shadow-sm">
                        {profile ? (
                            <img 
                                src={profile} 
                                alt={otherUser?.fullName || "User"} 
                                className="object-cover w-full h-full" 
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentNode.textContent = initial;
                                }}
                            />
                        ) : (
                            initial
                        )}
                    </div>
                    
                    {/* Pulsing online badge */}
                    <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface ${
                            isOnline ? "bg-success" : "bg-text-disabled"
                        }`}
                    >
                        {isOnline && (
                            <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
                        )}
                    </span>
                </div>
                
                <div>
                    <h1 className="text-sm font-bold text-text-primary tracking-wide leading-tight">
                        {otherUser?.fullName || "User"}
                    </h1>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-success animate-pulse" : "bg-text-disabled"}`} />
                        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                            {isOnline ? "Active Now" : "Offline"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Premium Top Bar Actions (Right Side) */}
            <div className="flex items-center gap-1.5">
                <button className="h-9 w-9 flex items-center justify-center rounded-lg text-text-muted hover:bg-hover-bg hover:text-text-primary transition-all duration-200" title="Start voice call">
                    <Phone size={16} />
                </button>
                <button className="h-9 w-9 flex items-center justify-center rounded-lg text-text-muted hover:bg-hover-bg hover:text-text-primary transition-all duration-200" title="Start video call">
                    <Video size={16} />
                </button>
                <div className="h-4 w-[1px] bg-border-subtle mx-1" />
                <button className="h-9 w-9 flex items-center justify-center rounded-lg text-text-muted hover:bg-hover-bg hover:text-text-primary transition-all duration-200" title="Search messages">
                    <Search size={16} />
                </button>
                <button className="h-9 w-9 flex items-center justify-center rounded-lg text-text-muted hover:bg-hover-bg hover:text-text-primary transition-all duration-200" title="Conversation settings">
                    <Settings size={16} />
                </button>
            </div>
        </div>
    );
}

export default Chatuser;