import React, { useState } from "react";
import { Sparkles, Copy, Check, Cpu } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import useConversation from "../../../zustand/useConversation.js";

function Message({ message }) {
    const { selectedConversation } = useConversation();
    const authUser = JSON.parse(localStorage.getItem("ChatApp"));

    if (!message) return null;

    // Check if senderId is populated object or plain string
    const senderIdStr =
        typeof message.senderId === "object"
            ? message.senderId?._id?.toString()
            : message.senderId?.toString();

    const itsMe = senderIdStr === authUser.user._id.toString();

    const formattedTime = message.createdAt
        ? new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        })
        : "";

    // Get sender name — works for both DM and workspace
    let senderName = "User";

    if (itsMe) {
        senderName = "You";
    } else if (typeof message.senderId === "object" && message.senderId?.fullName) {
        senderName = message.senderId.fullName;
    } else if (selectedConversation) {
        const otherUser = selectedConversation.members?.find(
            (member) =>
                (member._id || member).toString() !== authUser.user._id.toString()
        );
        senderName = otherUser?.fullName || "User";
    }

    const initial = senderName !== "You"
        ? senderName.charAt(0).toUpperCase()
        : authUser.user.fullName?.charAt(0).toUpperCase();

    /* ================= AI MESSAGE ================= */
    if (message.isAI) {
        return (
            <div className="flex gap-4 px-6 md:px-8 py-5 group transition-all">
                {/* AI CPU Icon Badge */}
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-md shadow-violet-500/10 flex-shrink-0 animate-pulse">
                    <Cpu size={16} className="text-white" />
                </div>
                
                {/* Beautiful custom markdown bubble */}
                <div className="relative bg-card border border-primary/25 rounded-2xl rounded-tl-sm p-4 w-full max-w-3xl shadow-md overflow-hidden min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={13} className="text-violet-400" />
                        <span className="text-[10px] font-bold text-violet-400 tracking-wider uppercase">
                            Gemini AI
                        </span>
                    </div>

                    <div className="text-sm text-text-primary leading-7 break-words overflow-x-hidden markdown-body prose prose-invert max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code({ node, inline, className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || "");
                                    return !inline && match ? (
                                        <CodeBlock language={match[1]} value={String(children).replace(/\n$/, "")} />
                                    ) : (
                                        <code
                                            className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-primary text-xs font-mono"
                                            {...props}
                                        >
                                            {children}
                                        </code>
                                    );
                                },
                                p: ({ children }) => <p className="mb-3 last:mb-0 text-text-primary">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1 text-text-secondary">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-text-secondary">{children}</ol>,
                                h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4 text-text-primary border-b border-border-subtle pb-1">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 text-text-primary">{children}</h2>,
                                a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">{children}</a>,
                                blockquote: ({ children }) => <blockquote className="border-l-4 border-violet-500 pl-3 py-0.5 my-3 bg-primary-soft/10 text-text-secondary italic rounded-r">{children}</blockquote>,
                            }}
                        >
                            {message.message}
                        </ReactMarkdown>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-border-subtle">
                        <span className="text-[10px] text-text-muted">{formattedTime}</span>
                        <span className="text-[9px] text-text-muted/60 font-semibold tracking-widest uppercase">System Smart Reply</span>
                    </div>

                    {/* Gradient accent glow inside the AI block */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-violet-500/5 to-transparent pointer-events-none" />
                </div>
            </div>
        );
    }

    /* ================= NORMAL MESSAGE ================= */
    return (
        <div className={`flex px-6 md:px-8 py-3 ${itsMe ? "justify-end" : "justify-start"}`}>
            <div className={`flex gap-3.5 max-w-2xl ${itsMe ? "flex-row-reverse text-right" : ""}`}>
                {/* Avatar with dynamic colors */}
                <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-xs text-white font-bold shadow-sm select-none
                    ${itsMe 
                        ? "bg-gradient-to-tr from-primary to-info" 
                        : "bg-gradient-to-br from-indigo-500 to-purple-500"
                    }
                `}>
                    {initial}
                </div>

                <div className="flex flex-col">
                    {/* Header */}
                    <div className={`flex items-center gap-2 mb-1 ${itsMe ? "justify-end flex-row-reverse" : ""}`}>
                        <p className="text-xs font-bold text-text-primary">
                            {senderName}
                        </p>
                        <span className="text-[10px] text-text-muted">{formattedTime}</span>
                    </div>

                    {/* Chat Bubble with dynamic corner radius */}
                    <div
                        className={`px-4.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm border
                            ${itsMe 
                                ? "bg-primary text-white border-primary/20 rounded-tr-none" 
                                : "bg-muted text-text-primary border-border-subtle rounded-tl-none"
                            }`}
                    >
                        {message.message}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ================= CODEBLOCK SUB-COMPONENT ================= */
const CodeBlock = ({ language, value }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-3.5 max-w-full overflow-hidden rounded-xl border border-border-subtle bg-[#1E1E1E]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#2D2D2D]/60 border-b border-border-subtle">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold">
                    {language || "text"}
                </span>

                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
                >
                    {copied ? (
                        <>
                            <Check size={12} className="text-green-400" />
                            <span className="text-green-400 text-[10px] font-bold">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={12} />
                            <span className="text-[10px]">Copy</span>
                        </>
                    )}
                </button>
            </div>

            {/* Code */}
            <div className="w-full overflow-x-auto">
                <SyntaxHighlighter
                    language={language || "text"}
                    style={vscDarkPlus}
                    wrapLongLines={false}
                    customStyle={{
                        margin: 0,
                        padding: "14px",
                        background: "transparent",
                        minWidth: "max-content",
                    }}
                >
                    {value}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

export default Message;