import React, { useState, useRef } from "react";
import { useSocketContext } from "../../../context/SocketContext.jsx";
import useSendMessage from "../../../context/useSendMessage.js";
import useSendAiMessage from "../../../context/useSendAiMessage.jsx";
import useConversation from "../../../zustand/useConversation.js";
import { useAuth } from "../../../context/AuthProvider.jsx";
import { FiSmile, FiAtSign } from "react-icons/fi";
import { IoSend } from "react-icons/io5";
import { HiPlus } from "react-icons/hi";

function Typesend() {
    const [text, setText] = useState("");
    const [typing, setTyping] = useState(false);
    const typingTimeout = useRef(null);

    const { socket } = useSocketContext();
    const { sendMessages, loading: msgLoading } = useSendMessage();
    const { sendAiMessage, loading: aiLoading } = useSendAiMessage();
    const { selectedConversation, selectedWorkspace } = useConversation();
    const [authUser] = useAuth();

    const emitTyping = (isTyping) => {
        // ✅ Only emit typing for DM conversations, not workspaces
        if (!socket || !selectedConversation?._id) return;

        const myId = authUser?.user?._id;
        if (!myId) return;

        const receiverId = selectedConversation.members?.find(
            (m) => m.toString() !== myId.toString()
        );
        if (!receiverId) return;

        socket.emit("typing", {
            to: receiverId.toString(),
            conversationId: selectedConversation._id,
            typing: isTyping,
        });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        const isAiMessage = text.toLowerCase().includes("@ai");

        if (isAiMessage) {
            const prompt = text.replace(/@ai/i, "").trim();
            if (prompt) {
                await sendAiMessage(prompt); // ✅ send AI message only
            }
        } else {
            await sendMessages(text); // ✅ send normal message
        }

        setText("");
        setTyping(false);

        // ✅ Only emit typing stop for DM
        if (selectedConversation?._id) {
            emitTyping(false);
        }
    };

    const handleChange = (e) => {
        setText(e.target.value);

        // ✅ Only emit typing for DM conversations
        if (selectedConversation?._id) {
            setTyping(true);
            emitTyping(true);
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => {
                setTyping(false);
                emitTyping(false);
            }, 800);
        }
    };

    const placeholder = selectedWorkspace && !selectedConversation
        ? `Message #${selectedWorkspace.name}... (use @ai for AI)`
        : "Message... (use @ai for AI)";

    return (
        <form
            onSubmit={handleSend}
            className="px-6 py-4 border-t border-[#1f2937] bg-[#0b1120]"
        >
            <div className="flex items-center bg-[#111827] border border-[#1f2937] rounded-xl px-4 py-3 shadow-inner">
                <button type="button" className="text-gray-400 hover:text-gray-200 mr-3 transition">
                    <HiPlus size={20} />
                </button>
                <button type="button" className="text-gray-400 hover:text-gray-200 mr-3 transition">
                    <FiSmile size={18} />
                </button>
                <button type="button" className="text-gray-400 hover:text-gray-200 mr-3 transition">
                    <FiAtSign size={18} />
                </button>

                <input
                    type="text"
                    value={text}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent outline-none text-sm text-gray-200 placeholder-gray-500"
                />

                {typing && (
                    <div className="text-gray-400 text-xs mr-3 animate-pulse">typing...</div>
                )}

                <button
                    type="submit"
                    disabled={msgLoading || aiLoading}
                    className="ml-2 w-9 h-9 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 transition disabled:opacity-40"
                >
                    <IoSend size={16} className="text-white" />
                </button>
            </div>
        </form>
    );
}

export default Typesend;