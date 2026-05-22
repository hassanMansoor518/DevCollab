// AIMessages.jsx
import React, { useEffect, useRef } from "react";
import useAIMessages from "../../../context/useAIMessages.js";
import AIMessage from "./AIMessage.jsx";
import { Bot, Sparkles } from "lucide-react";

function AIMessages() {
    const aiMessages = useAIMessages((state) => state.aiMessages);
    const lastRef = useRef(null);

    useEffect(() => {
        if (aiMessages.length === 0) return;
        const timer = setTimeout(() => {
            lastRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "end",
            });
        }, 100);
        return () => clearTimeout(timer);
    }, [aiMessages]);

    return (
        <div className="flex flex-col gap-6 px-1 md:px-4 py-4">
            {aiMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center select-none">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/15 mb-5 animate-pulse">
                        <Bot size={28} className="text-white" />
                    </div>

                    <h2 className="text-xl font-bold text-text-primary mb-2 flex items-center gap-2">
                        <Sparkles size={16} className="text-violet-400" />
                        DevCollab AI Assistant
                    </h2>

                    <p className="text-text-secondary text-sm max-w-md leading-relaxed">
                        Repository-aware AI engineering assistant. 
                        Ask questions about code structure, bug logs, API requests, database designs, or active commits.
                    </p>
                </div>
            )}

            {aiMessages.map((msg, index) => (
                <div 
                    key={msg._id || index} 
                    ref={index === aiMessages.length - 1 ? lastRef : null}
                    className="animate-fade-in"
                >
                    <AIMessage message={msg} />
                </div>
            ))}
        </div>
    );
}

export default AIMessages;