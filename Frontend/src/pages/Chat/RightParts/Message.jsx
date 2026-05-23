import React, { useState, useRef } from "react";
import { Sparkles, Copy, Check, Cpu, File, FileText, FileArchive, FileSpreadsheet, Download, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import useConversation from "../../../zustand/useConversation.js";
import axios from "axios";

// Helper to choose file icon based on extension
const FileIcon = ({ filename }) => {
    const ext = filename.split(".").pop().toLowerCase();
    if (["pdf"].includes(ext)) return <FileText size={18} className="text-red-400" />;
    if (["zip", "rar", "tar", "gz"].includes(ext)) return <FileArchive size={18} className="text-amber-400" />;
    if (["doc", "docx"].includes(ext)) return <FileText size={18} className="text-blue-400" />;
    if (["xls", "xlsx", "csv"].includes(ext)) return <FileSpreadsheet size={18} className="text-emerald-400" />;
    return <File size={18} />;
};

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

    // Get sender name
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

    const { messages, setMessage } = useConversation();
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(message.message);
    const [actionLoading, setActionLoading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    // Helper to parse file attachments
    const parseAttachment = (text) => {
        if (!text) return { hasAttachment: false, remainingText: "" };
        const fileRegex = /^\[File:\s*([^|\]]+)(?:\|([^\]]+))?\]\((data:[^)]+)\)/;
        const match = text.match(fileRegex);
        if (match) {
            const [fullMatch, filename, size, base64Data] = match;
            const remainingText = text.replace(fullMatch, "").trim();
            const isImage = base64Data.startsWith("data:image/");
            return {
                hasAttachment: true,
                filename,
                size: size || "Unknown size",
                base64Data,
                isImage,
                remainingText
            };
        }
        return { hasAttachment: false, remainingText: text };
    };

    const attachment = parseAttachment(message.message);

    /* ================= AI MESSAGE ================= */
    if (message.isAI) {
        return (
            <div className="flex gap-4 px-6 md:px-8 py-5 group transition-all">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-md shadow-violet-500/10 flex-shrink-0 animate-pulse">
                    <Cpu size={16} className="text-white" />
                </div>
                
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

                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-violet-500/5 to-transparent pointer-events-none" />
                </div>
            </div>
        );
    }

    /* ================= NORMAL MESSAGE ================= */
    return (
        <div className={`flex px-6 md:px-8 py-3 ${itsMe ? "justify-end" : "justify-start"}`}>
            <div className={`flex gap-3.5 max-w-2xl ${itsMe ? "flex-row-reverse text-right" : ""}`}>
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

                        {itsMe && (
                            <div className="ml-2 relative">
                                <button onClick={() => setShowMenu((s) => !s)} className="p-1 rounded-md text-text-muted hover:bg-hover-bg">
                                    <MoreHorizontal size={14} />
                                </button>

                                {showMenu && (
                                    <div ref={menuRef} className="absolute right-0 mt-2 w-36 bg-card border border-border-subtle rounded-lg shadow-lg z-30">
                                        <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full text-left px-3 py-2 hover:bg-hover-bg flex items-center gap-2">
                                            <Edit size={14} />
                                            <span className="text-sm">Edit</span>
                                        </button>
                                        <button onClick={async () => {
                                            if (!confirm('Delete this message?')) return;
                                            setShowMenu(false);
                                            setActionLoading(true);
                                            try {
                                                if (message.workspaceId) {
                                                    await axios.delete(`/api/workspace/message/${message._id}`, { withCredentials: true });
                                                } else {
                                                    await axios.delete(`/api/message/${message._id}`, { withCredentials: true });
                                                }
                                                const newMsgs = (messages || []).filter((m) => (m._id || m.id) !== message._id);
                                                setMessage(newMsgs);
                                            } catch (err) {
                                                console.error('Delete failed', err);
                                            } finally {
                                                setActionLoading(false);
                                            }
                                        }} className="w-full text-left px-3 py-2 hover:bg-hover-bg text-rose-600 flex items-center gap-2">
                                            <Trash2 size={14} />
                                            <span className="text-sm">{actionLoading ? 'Deleting...' : 'Delete'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Chat Bubble with dynamic corner radius and file viewer */}
                    <div
                        className={`px-4.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm border text-left
                            ${itsMe 
                                ? "bg-primary text-white border-primary/20 rounded-tr-none" 
                                : "bg-muted text-text-primary border-border-subtle rounded-tl-none"
                            }`}
                    >
                        {isEditing ? (
                            <div className="flex flex-col gap-2">
                                <textarea className="w-full p-2 rounded-md text-sm" rows={4} value={editText} onChange={(e) => setEditText(e.target.value)} />
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => { setIsEditing(false); setEditText(message.message); }} className="text-sm px-3 py-1 rounded-md bg-muted">Cancel</button>
                                    <button onClick={async () => {
                                        setActionLoading(true);
                                        try {
                                            let res;
                                            if (message.workspaceId) {
                                                res = await axios.put(`/api/workspace/message/${message._id}`, { message: editText }, { withCredentials: true });
                                            } else {
                                                res = await axios.put(`/api/message/${message._id}`, { message: editText }, { withCredentials: true });
                                            }

                                            const updated = res.data;
                                            const newMsgs = (messages || []).map((m) => (m._id === updated._id ? updated : m));
                                            setMessage(newMsgs);
                                            setIsEditing(false);
                                        } catch (err) {
                                            console.error('Edit failed', err);
                                        } finally {
                                            setActionLoading(false);
                                        }
                                    }} className="text-sm px-3 py-1 rounded-md bg-primary text-white">{actionLoading ? '...' : 'Save'}</button>
                                </div>
                            </div>
                        ) : attachment.hasAttachment ? (
                            <div className="flex flex-col gap-2.5">
                                {/* Visual File Rendering */}
                                {attachment.isImage ? (
                                    <div className="rounded-xl overflow-hidden border border-border-subtle max-w-sm bg-black/5 shadow-sm">
                                        <img 
                                            src={attachment.base64Data} 
                                            alt={attachment.filename} 
                                            className="w-full h-auto max-h-56 object-contain cursor-zoom-in hover:opacity-95 transition"
                                            onClick={() => {
                                                const w = window.open();
                                                w.document.write(`<img src="${attachment.base64Data}" style="max-width:100%; height:auto; margin:auto; display:block;" />`);
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <a 
                                        href={attachment.base64Data} 
                                        download={attachment.filename}
                                        className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium no-underline transition-all
                                            ${itsMe 
                                                ? "bg-white/10 border-white/20 text-white hover:bg-white/15" 
                                                : "bg-surface border-border-subtle text-text-primary hover:bg-hover-bg"
                                            }
                                        `}
                                    >
                                        <div className={`p-2 rounded-lg shrink-0
                                            ${itsMe ? "bg-white/15 text-white" : "bg-primary-soft text-primary"}
                                        `}>
                                            <FileIcon filename={attachment.filename} />
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="font-bold truncate leading-tight">{attachment.filename}</p>
                                            <p className={`text-[10px] leading-none mt-1.5 ${itsMe ? "text-white/60" : "text-text-muted"}`}>
                                                {attachment.size}
                                            </p>
                                        </div>
                                        <Download size={14} className="shrink-0 opacity-80" />
                                    </a>
                                )}
                                
                                {/* Accompanying Text Description */}
                                {attachment.remainingText && (
                                    <p className="mt-1 text-sm leading-relaxed">{attachment.remainingText}</p>
                                )}
                            </div>
                        ) : (
                            message.message
                        )}
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