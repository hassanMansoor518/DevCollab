import React, { useState, useRef } from "react";
import { useSocketContext } from "../../../context/SocketContext.jsx";
import useSendMessage from "../../../context/useSendMessage.js";
import useSendAiMessage from "../../../context/useSendAiMessage.jsx";
import useConversation from "../../../zustand/useConversation.js";
import { useAuth } from "../../../context/AuthProvider.jsx";
import { Smile, AtSign, Plus, Send, Sparkles, Loader2 } from "lucide-react";

function Typesend() {
    const [text, setText] = useState("");
    const [typing, setTyping] = useState(false);
    const typingTimeout = useRef(null);

    const { socket } = useSocketContext();
    const { sendMessages, loading: msgLoading } = useSendMessage();
    const { sendAiMessage, loading: aiLoading } = useSendAiMessage();
    const { selectedConversation, selectedWorkspace } = useConversation();
    const [authUser] = useAuth();

    const isAiMessageActive = text.toLowerCase().includes("@ai");
    const isLoading = msgLoading || aiLoading;

    const emitTyping = (isTyping) => {
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
        if (!text.trim() || isLoading) return;

        const isAiMessage = text.toLowerCase().includes("@ai");

        if (isAiMessage) {
            const prompt = text.replace(/@ai/i, "").trim();
            if (prompt) {
                await sendAiMessage(prompt);
            }
        } else {
            await sendMessages(text);
        }

        setText("");
        setTyping(false);

        if (selectedConversation?._id) {
            emitTyping(false);
        }
    };

    const handleChange = (e) => {
        setText(e.target.value);

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
        ? `Message #${selectedWorkspace.name}... (Type @ai for Gemini)`
        : "Message conversation... (Type @ai for Gemini)";

    return (
        <form
            onSubmit={handleSend}
            className="px-6 py-4.5 border-t border-border-subtle bg-surface select-none z-10"
        >
            <div className={`flex items-center bg-input-bg border rounded-2xl px-4 py-3 shadow-sm transition-all duration-300
                ${isAiMessageActive 
                    ? "border-violet-500/40 ring-4 ring-violet-500/5 shadow-violet-500/5" 
                    : "border-border-default focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5"
                }
            `}>
                {/* Actions Grid (Left) */}
                <div className="flex items-center gap-1 mr-3 shrink-0">
                    <button 
                        type="button" 
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-hover-bg hover:text-text-primary transition"
                        title="Upload file or attachment"
                    >
                        <Plus size={18} />
                    </button>
                    <button 
                        type="button" 
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-hover-bg hover:text-text-primary transition"
                        title="Add emoji"
                    >
                        <Smile size={18} />
                    </button>
                    <button 
                        type="button" 
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-hover-bg hover:text-text-primary transition"
                        title="Mention team member"
                    >
                        <AtSign size={16} />
                    </button>
                </div>

                {/* Input Area */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                    {/* Gemini Glowing Indicator badge if typing @ai */}
                    {isAiMessageActive && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-[10px] font-bold text-white shadow-md shadow-violet-500/10 animate-fade-in shrink-0">
                            <Sparkles size={11} className="animate-pulse" />
                            <span>Gemini Mode</span>
                        </div>
                    )}
                    
                    <input
                        type="text"
                        value={text}
                        onChange={handleChange}
                        placeholder={placeholder}
                        className="w-full bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted/65"
                    />
                </div>

                {/* Typing status fallback */}
                {typing && (
                    <span className="text-[10px] font-semibold text-text-muted animate-pulse shrink-0 mr-3">
                        typing...
                    </span>
                )}

                {/* Send Button */}
                <button
                    type="submit"
                    disabled={!text.trim() || isLoading}
                    className={`ml-2 w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 shrink-0 shadow-sm
                        ${isAiMessageActive 
                            ? "bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-600/10" 
                            : "bg-primary hover:bg-primary-hover text-white shadow-primary/10"
                        }
                        disabled:opacity-30 disabled:scale-95 disabled:pointer-events-none
                    `}
                >
                    {isLoading ? (
                        <Loader2 size={16} className="text-white animate-spin" />
                    ) : (
                        <Send size={15} className="text-white" />
                    )}
                </button>
            </div>
        </form>
    );
}

export default Typesend;