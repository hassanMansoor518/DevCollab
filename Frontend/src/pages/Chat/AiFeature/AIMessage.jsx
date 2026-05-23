import React, { useState } from "react";
import { Bot, User, Sparkles, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

function AIMessage({ message }) {
    const text =
        typeof message.message === "string"
            ? message.message
            : message.message?.message || "";

    return (
        <div
            className={`flex w-full ${message.isAI ? "justify-start" : "justify-end"}`}
        >
            <div
                className={`flex gap-3 w-full max-w-4xl min-w-0 ${message.isAI ? "flex-row" : "flex-row-reverse"
                    }`}
            >
                {/* Avatar */}
                <div
                    className={`shrink-0 ${message.isAI
                        ? "w-10 h-10 rounded-2xl flex items-center justify-center shadow-md border bg-gradient-to-br from-violet-600 to-blue-600 border-violet-500/30"
                        : ""
                        }`}
                >
                    {message.isAI ? <Bot size={18} className="text-white" /> : null}
                </div>

                {/* Message Bubble */}
                <div
                    className={`relative rounded-3xl shadow-sm border backdrop-blur-sm transition-all duration-300 ${message.isAI
                        ? "px-5 py-4 bg-surface text-text-primary border-border-default w-full min-w-0 overflow-hidden"
                        : "px-7 py-3 bg-primary text-white border-primary-hover w-fit"
                        }`}
                >
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                        {message.isAI && (
                            <>
                                <Sparkles size={14} className="text-violet-500 dark:text-violet-400" />
                                <span className="text-xs font-semibold text-violet-600 dark:text-violet-300 tracking-wide uppercase">
                                    AI Assistant
                                </span>
                            </>
                        )}
                    </div>

                    {/* Text / Markdown Content */}
                    <div className="text-sm leading-7 break-words overflow-x-hidden">
                        {message.isAI ? (
                            <div className="markdown-body prose prose-slate dark:prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-0 text-text-primary">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        code({ node, inline, className, children, ...props }) {
                                            const match = /language-(\w+)/.exec(className || "");
                                            return !inline && match ? (
                                                <CodeBlock language={match[1]} value={String(children).replace(/\n$/, "")} />
                                            ) : (
                                                <code
                                                    className="
    inline-flex
    items-center
    px-2
    py-0.5
    rounded
    bg-input-bg
    border
    border-border-subtle
    text-primary
    text-[13px]
    font-mono
  "
                                                    {...props}
                                                >
                                                    {children}
                                                </code>
                                            );
                                        },
                                        p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                                        ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>,
                                        h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-text-primary">{children}</h1>,
                                        h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5 text-text-primary">{children}</h2>,
                                        h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4 text-text-primary">{children}</h3>,
                                        a: ({ href, children }) => <a href={href} className="text-primary hover:underline">{children}</a>,
                                        blockquote: ({ children }) => <blockquote className="border-l-4 border-violet-500 pl-4 py-1 mb-4 bg-violet-500/10 rounded-r-lg italic text-text-secondary">{children}</blockquote>,
                                        table: ({ children }) => <div className="overflow-x-auto mb-4"><table className="min-w-full border border-border-default divide-y divide-border-default">{children}</table></div>,
                                        th: ({ children }) => <th className="px-4 py-2 bg-hover-bg text-left text-xs font-medium text-text-secondary uppercase tracking-wider">{children}</th>,
                                        td: ({ children }) => <td className="px-4 py-2 whitespace-nowrap text-sm text-text-secondary border-t border-border-subtle">{children}</td>,
                                    }}
                                >
                                    {text}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <div className="whitespace-pre-wrap">{text}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const CodeBlock = ({ language, value }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-4 max-w-full overflow-hidden rounded-xl border border-border-default bg-[#1E1E1E]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#2D2D2D] border-b border-gray-700">
                <span className="text-xs font-mono text-gray-400 lowercase">
                    {language || "text"}
                </span>

                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
                >
                    {copied ? (
                        <>
                            <Check size={14} className="text-green-400" />
                            <span className="text-green-400">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={14} />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>

            {/* Scrollable Code Area */}
            <div className="w-full overflow-x-auto">
                <SyntaxHighlighter
                    language={language || "text"}
                    style={vscDarkPlus}
                    wrapLongLines={false}
                    customStyle={{
                        margin: 0,
                        padding: "16px",
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

export default AIMessage;