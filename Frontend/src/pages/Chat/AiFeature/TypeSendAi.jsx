
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSocketContext } from "../../../context/SocketContext.jsx";
import useSendMessage from "../../../context/useSendMessage.js";
import useSendAiMessage from "../../../context/useSendAiMessage.jsx";
import useConversation from "../../../zustand/useConversation.js";
import { useAuth } from "../../../context/AuthProvider.jsx";
import { Send, FileUp, Binary, AlertTriangle } from "lucide-react";

function TypeSendAi({ isAiPage = false }) {
    const [text, setText] = useState("");
    const typingTimeout = useRef(null);
    const textareaRef = useRef(null);

    const { socket } = useSocketContext();
    const { sendMessages, loading: msgLoading } = useSendMessage();
    const { sendAiMessage, loading: aiLoading } = useSendAiMessage();
    const { selectedConversation } = useConversation();
    const [authUser] = useAuth();

    useEffect(() => {
        if (!textareaRef.current) return;

        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(
            textareaRef.current.scrollHeight,
            180
        )}px`;
    }, [text]);

    useEffect(() => {
        return () => {
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
        };
    }, []);

    const emitTyping = useCallback(
        (isTyping) => {
            if (!socket || !selectedConversation?._id) return;

            const myId = authUser?.user?._id;

            const receiverId = selectedConversation.members?.find(
                (m) => m.toString() !== myId?.toString()
            );

            if (!receiverId) return;

            socket.emit("typing", {
                to: receiverId.toString(),
                conversationId: selectedConversation._id,
                typing: isTyping,
            });
        },
        [socket, selectedConversation, authUser]
    );

    const handleSend = async (e) => {
        e.preventDefault();

        const cleanText = text.trim();
        if (!cleanText) return;

        setText("");
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        if (selectedConversation?._id) emitTyping(false);

        if (textareaRef.current) textareaRef.current.style.height = "auto";

        try {
            if (isAiPage) {
                await sendAiMessage(cleanText);
            } else {
                await sendMessages(cleanText);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleChange = (e) => {
        setText(e.target.value);

        if (!selectedConversation?._id) return;

        emitTyping(true);

        if (typingTimeout.current) clearTimeout(typingTimeout.current);

        typingTimeout.current = setTimeout(() => {
            emitTyping(false);
        }, 700);
    };

    const insertPrompt = (type) => {
        let newText = text;

        if (type === "explain") {
            newText += "\nExplain this code:\n```\n[Paste Code]\n```";
        }

        if (type === "bug") {
            newText += "\nFind bugs in this code:\n```\n[Paste Code]\n```";
        }

        setText(newText);
        textareaRef.current?.focus();
    };

    const loading = msgLoading || aiLoading;

    return (
        <form className="px-6 pb-3">
            <div className="max-w-5xl mx-auto">

                {/* OUTER CONTAINER (NO GLOW VERSION) */}
                <div className="
          bg-gradient-to-br from-[#0b1220] to-[#0f172a]
          border border-[#1f2a44]
          rounded-2xl
          shadow-xl
          p-4
          transition-all
        ">

                    {/* TEXTAREA */}
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={handleChange}
                        placeholder={
                            isAiPage
                                ? "Ask AI about your code, bugs, architecture..."
                                : "Type a message..."
                        }
                        className="
              w-full
              bg-transparent
              outline-none
              text-gray-200
              placeholder-gray-500
              text-sm
              resize-none
              min-h-[45px]
              max-h-[180px]
              leading-6
            "
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                    />

                    {/* ACTION BAR */}
                    <div className="flex justify-between items-center mt-3">

                        <div className="flex gap-2">
                            <button type="button" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111827] border border-[#243244] text-gray-300 text-xs hover:bg-[#1a2436] transition">
                                <FileUp size={14} className="text-cyan-400" />
                                Upload
                            </button>

                            <button type="button" onClick={() => insertPrompt("explain")} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111827] border border-[#243244] text-gray-300 text-xs hover:bg-[#1a2436] transition">
                                <Binary size={14} className="text-blue-400" />
                                Explain
                            </button>

                            <button type="button" onClick={() => insertPrompt("bug")} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111827] border border-[#243244] text-gray-300 text-xs hover:bg-[#1a2436] transition">
                                <AlertTriangle size={14} className="text-red-400" />
                                Bugs
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="
                flex items-center justify-center
                w-10 h-10
                rounded-xl
                bg-gradient-to-r from-blue-600 to-indigo-600
                hover:from-blue-500 hover:to-indigo-500
                disabled:opacity-40
                shadow-lg
                transition
              "
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send size={18} />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <p className="text-center text-[10px] text-gray-500 mt-2">
                AI can make mistakes. Verify important outputs.
            </p>
        </form>
    );
}

export default TypeSendAi;
