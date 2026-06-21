import React from "react";
import { motion } from "framer-motion";
import useConversation from "../../../zustand/useConversation.js";
import { useSocketContext } from "../../../context/SocketContext.jsx";
import profile from "../../../assets/Profile.png";

const API_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || "https://ai-powered-chat-application-production.up.railway.app");

function User({ user }) {
    const { selectedConversation, setSelectedConversation, setSelectedWorkspace } = useConversation();
    const { onlineUsers } = useSocketContext();

    if (!user) return null;
    const isSelected = selectedConversation?._id === user._id;
    const userId = user._id?.toString();
    const isOnline = userId
        ? onlineUsers.some((id) => id?.toString() === userId)
        : false;
    const initial = user.fullName ? user.fullName.charAt(0).toUpperCase() : "?";

    const handleClick = async () => {
        if (!user?._id) return;

        try {
            const res = await fetch(`${API_URL}/api/conversation/get-or-create/${user._id}`, {
                credentials: "include",
            });

            if (!res.ok) {
                const text = await res.text().catch(() => null);
                console.error('get-or-create response:', res.status, text);
                throw new Error(`Failed to get/create conversation (${res.status})`);
            }

            const conversation = await res.json();
            setSelectedConversation(conversation);
            setSelectedWorkspace(null); // ✅ Clear active workspace to ensure clean direct message routing

        } catch (err) {
            console.error("Error getting/creating conversation:", err);
        }
    };

    return (
        <motion.div
            onClick={handleClick}
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={`
                flex items-center gap-3
                px-3.5 py-2.5 mx-2 rounded-xl
                cursor-pointer relative
                transition-all duration-300
                ${isSelected
                    ? "bg-primary text-white shadow-md shadow-primary/10"
                    : "hover:bg-hover-bg text-text-secondary hover:text-text-primary"
                }
            `}
        >
            {/* Active Highlight Bar */}
            {isSelected && (
                <span className="absolute left-0 top-1/4 h-1/2 w-1 bg-white rounded-r-md" />
            )}

            {/* Avatar / Initials Fallback */}
            <div className="relative flex-shrink-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white overflow-hidden shadow-sm
					${isSelected ? "bg-white/20" : "bg-gradient-to-tr from-primary to-info"}
                `}>
                    {user.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.fullName}
                            className="w-full h-full object-cover animate-in fade-in duration-300"
                        />
                    ) : (
                        initial
                    )}
                </div>

                {/* Online Status Dot */}
                <span
                    className={`
                        absolute -bottom-0.5 -right-0.5
                        w-3 h-3 rounded-full
                        border-2
                        ${isSelected ? "border-primary" : "border-surface"}
                        ${isOnline ? "bg-success" : "bg-text-disabled"}
                    `}
                >
                    {isOnline && (
                        <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
                    )}
                </span>
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isSelected ? "text-white" : "text-text-primary"}`}>
                    {user.fullName}
                </p>
                <p className={`text-[11px] truncate ${isSelected ? "text-white/70" : "text-text-muted"}`}>
                    {isOnline ? "Active now" : "Offline"}
                </p>
            </div>
        </motion.div>
    );
}

export default User;
