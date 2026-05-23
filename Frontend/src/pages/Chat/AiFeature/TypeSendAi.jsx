import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSocketContext } from "../../../context/SocketContext.jsx";
import useSendMessage from "../../../context/useSendMessage.js";
import useSendAiMessage from "../../../context/useSendAiMessage.jsx";
import useConversation from "../../../zustand/useConversation.js";
import { useAuth } from "../../../context/AuthProvider.jsx";
import { Send, FileUp, Binary, AlertTriangle, HelpCircle } from "lucide-react";

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
                await sendAiMessage(cleanText, true);
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
        <form className="px-6 pb-4 select-none">
            <div className="max-w-5xl mx-auto">
                <div className="bg-surface border border-border-subtle rounded-2xl shadow-lg p-4 transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5">
                    {/* TEXTAREA */}
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={handleChange}
                        placeholder={
                            isAiPage
                                ? "Ask AI about your repository code, bug logs, API architectures..."
                                : "Type a message..."
                        }
                        className="w-full bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted/65 resize-none min-h-[45px] max-h-[180px] leading-6"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                    />

                    {/* ACTION BAR */}
                    <div className="flex justify-between items-center mt-3 border-t border-border-subtle pt-3">
                        <div className="flex gap-2">
                            <button 
                                type="button" 
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-hover-bg border border-border-subtle text-text-secondary text-xs hover:bg-active-bg transition font-semibold"
                            >
                                <FileUp size={13} className="text-info" />
                                Upload
                            </button>

                            <button 
                                type="button" 
                                onClick={() => insertPrompt("explain")} 
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-hover-bg border border-border-subtle text-text-secondary text-xs hover:bg-active-bg transition font-semibold"
                            >
                                <Binary size={13} className="text-primary" />
                                Explain
                            </button>

                            <button 
                                type="button" 
                                onClick={() => insertPrompt("bug")} 
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-hover-bg border border-border-subtle text-text-secondary text-xs hover:bg-active-bg transition font-semibold"
                            >
                                <AlertTriangle size={13} className="text-danger" />
                                Bugs
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !text.trim()}
                            className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary hover:bg-primary-hover text-white disabled:opacity-30 shadow-md shadow-primary/10 transition duration-300"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send size={15} />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <p className="text-center text-[10px] text-text-muted mt-2.5 font-medium flex items-center justify-center gap-1">
                <HelpCircle size={10} />
                AI can make mistakes. Verify important code fragments.
            </p>
        </form>
    );
}

export default TypeSendAi;
