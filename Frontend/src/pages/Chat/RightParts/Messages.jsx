import React, { useEffect, useRef } from "react";
import { Sparkles, MessageSquare } from "lucide-react";
import Message from "./Message.jsx";
import useGetMessage from "../../../context/useGetMessage.jsx";
import Loading from "../../../component/Loading.jsx";
import EmptyState from "../../../component/EmptyState.jsx";
import useConversation from "../../../zustand/useConversation.js";

function Messages() {
    const { loading, messages } = useGetMessage();
    const safeMessages = Array.isArray(messages) ? messages : [];
    const lastMsgRef = useRef();

    const { typingState, selectedConversation } = useConversation();

    // Smooth scroll to bottom on new messages
    useEffect(() => {
        if (safeMessages.length === 0) return;
        const timer = setTimeout(() => {
            lastMsgRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 100);
        return () => clearTimeout(timer);
    }, [safeMessages]);

    const typingInfo =
        selectedConversation?._id && typingState
            ? typingState[selectedConversation._id]
            : null;

    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto py-5 px-1 md:px-2 scrollbar-thin flex flex-col">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loading />
                    </div>
                ) : (
                    safeMessages.map((message, index) => (
                        <div
                            key={message._id || index}
                            ref={index === safeMessages.length - 1 ? lastMsgRef : null}
                        >
                            <Message message={message} />
                        </div>
                    ))
                )}

                {/* Typing indicator */}
                {typingInfo?.typing && (
                    <div className="px-8 py-3 flex items-center gap-2 text-xs text-primary font-semibold tracking-wide animate-pulse">
                        <Sparkles size={11} className="text-primary animate-spin" />
                        <span>Typing...</span>
                    </div>
                )}

                {!loading && safeMessages.length === 0 && (
                    <EmptyState
                        icon={<MessageSquare size={20} />}
                        title="No Messages Yet"
                        description="Send a message to start the conversation, or type @ai to ask the assistant a question."
                        minHeight="min-h-[280px]"
                    />
                )}
            </div>
        </div>
    );
}

export default Messages;
