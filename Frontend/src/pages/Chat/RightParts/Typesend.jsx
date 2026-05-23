import React, { useState, useRef, useEffect } from "react";
import { useSocketContext } from "../../../context/SocketContext.jsx";
import useSendMessage from "../../../context/useSendMessage.js";
import useSendAiMessage from "../../../context/useSendAiMessage.jsx";
import useConversation from "../../../zustand/useConversation.js";
import { useAuth } from "../../../context/AuthProvider.jsx";
import { Smile, AtSign, Plus, Send, Sparkles, Loader2, X, File, FileText, Image as ImageIcon } from "lucide-react";

// List of popular modern emojis for the quick picker
const POPULAR_EMOJIS = [
    "😀", "😂", "😍", "👍", "🔥", "🎉", "💻", "🚀", 
    "❤️", "✨", "👏", "🙌", "🌟", "💡", "🎨", "⚡"
];

function Typesend() {
    const [text, setText] = useState("");
    const [typing, setTyping] = useState(false);
    const typingTimeout = useRef(null);
    const fileInputRef = useRef(null);

    // Emojis & Files States
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null); // { name, size, base64 }

    const { socket } = useSocketContext();
    const { sendMessages, loading: msgLoading } = useSendMessage();
    const { sendAiMessage, loading: aiLoading } = useSendAiMessage();
    const { selectedConversation, selectedWorkspace } = useConversation();
    const [authUser] = useAuth();

    const isAiMessageActive = text.toLowerCase().startsWith("@ai");
    const isLoading = msgLoading || aiLoading;

    // Close emoji picker on click outside
    const emojiPickerRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
        
        const cleanText = text.trim();
        const hasAttachment = !!selectedFile;

        if (!cleanText && !hasAttachment) return;
        if (isLoading) return;

        // 1. Format payload: Embed file block at front if present
        let payload = cleanText;
        if (hasAttachment) {
            payload = `[File: ${selectedFile.name}|${selectedFile.size}](${selectedFile.base64})${cleanText ? "\n\n" + cleanText : ""}`;
        }

        const isAiMessage = payload.toLowerCase().startsWith("@ai");

        if (isAiMessage) {
            // Strip out `@ai` and trigger prompt
            const prompt = payload.replace(/^@ai\s*/i, "").trim();
            if (prompt) {
                await sendAiMessage(prompt);
            }
        } else {
            await sendMessages(payload);
        }

        // Reset inputs
        setText("");
        setSelectedFile(null);
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

    // Toggle prefixing @ai
    const handleToggleAi = () => {
        if (text.toLowerCase().startsWith("@ai")) {
            setText(text.replace(/^@ai\s*/i, ""));
        } else {
            setText("@ai " + text);
        }
    };

    // Click Emoji Handler
    const handleAddEmoji = (emoji) => {
        setText((prev) => prev + emoji);
        setShowEmojiPicker(false);
    };

    // Trigger Hidden File Selector
    const handleTriggerFile = () => {
        fileInputRef.current?.click();
    };

    // Handle selected file upload
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Size format (e.g. 1.2 MB)
        const formatSize = (bytes) => {
            if (bytes === 0) return "0 Bytes";
            const k = 1024;
            const sizes = ["Bytes", "KB", "MB", "GB"];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
        };

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            setSelectedFile({
                name: file.name,
                size: formatSize(file.size),
                type: file.type,
                base64: reader.result,
            });
        };
        // Reset file input value so same file can be selected again
        e.target.value = "";
    };

    const placeholder = selectedWorkspace && !selectedConversation
        ? `Message #${selectedWorkspace.name}... (Type @ai for Gemini)`
        : "Message conversation... (Type @ai for Gemini)";

    return (
        <form
            onSubmit={handleSend}
            className="px-6 py-4 border-t border-border-subtle bg-surface select-none z-10 relative"
        >
            {/* FILE INPUT (HIDDEN) */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
            />

            {/* ATTACHMENT BADGE DRAFT VIEW */}
            {selectedFile && (
                <div className="absolute left-6 bottom-[105%] bg-card border border-border-subtle shadow-lg p-2.5 rounded-2xl flex items-center gap-3 animate-slide-in max-w-sm z-30">
                    <div className="p-2 rounded-lg bg-primary-soft text-primary shrink-0">
                        {selectedFile.type.startsWith("image/") ? (
                            <ImageIcon size={16} />
                        ) : (
                            <FileText size={16} />
                        )}
                    </div>
                    <div className="min-w-0 text-left">
                        <p className="text-xs font-bold text-text-primary truncate max-w-[150px] leading-tight">
                            {selectedFile.name}
                        </p>
                        <p className="text-[9px] text-text-muted leading-none mt-1">
                            {selectedFile.size}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="p-1 rounded-lg text-text-muted hover:bg-hover-bg hover:text-text-primary transition shrink-0"
                    >
                        <X size={13} />
                    </button>
                </div>
            )}

            {/* EMOJI PICKER POPOVER */}
            {showEmojiPicker && (
                <div 
                    ref={emojiPickerRef}
                    className="absolute right-20 bottom-[105%] bg-card border border-border-subtle shadow-xl p-3 rounded-2xl grid grid-cols-4 gap-2 animate-fade-in z-30 w-44 backdrop-blur-sm"
                >
                    {POPULAR_EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => handleAddEmoji(emoji)}
                            className="text-lg hover:scale-125 hover:bg-hover-bg rounded-lg p-1.5 transition duration-150"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            {/* INPUT FIELD BAR */}
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
                        onClick={handleTriggerFile}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-hover-bg hover:text-text-primary transition"
                        title="Upload file or attachment"
                    >
                        <Plus size={18} />
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`h-8 w-8 flex items-center justify-center rounded-lg transition
                            ${showEmojiPicker ? "bg-hover-bg text-primary" : "text-text-muted hover:bg-hover-bg hover:text-text-primary"}
                        `}
                        title="Add emoji"
                    >
                        <Smile size={18} />
                    </button>
                    <button 
                        type="button" 
                        onClick={handleToggleAi}
                        className={`h-8 w-8 flex items-center justify-center rounded-lg transition
                            ${isAiMessageActive ? "bg-violet-500/10 text-violet-500" : "text-text-muted hover:bg-hover-bg hover:text-text-primary"}
                        `}
                        title="Toggle @ai prompt"
                    >
                        <AtSign size={16} />
                    </button>
                </div>

                {/* Input Area */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
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
                    disabled={(!text.trim() && !selectedFile) || isLoading}
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