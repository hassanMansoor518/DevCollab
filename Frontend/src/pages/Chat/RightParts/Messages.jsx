import React, { useEffect, useRef } from "react";
import Message from "./Message.jsx";
import useGetMessage from "../../../context/useGetMessage.jsx";
import Loading from "../../../component/Loading.jsx";
import useConversation from "../../../zustand/useConversation.js";

function Messages() {
  const { loading, messages } = useGetMessage();
  const safeMessages = Array.isArray(messages) ? messages : [];
  const lastMsgRef = useRef();

  useEffect(() => {
    if (safeMessages.length === 0) return;

    const timer = setTimeout(() => {
      lastMsgRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    return () => clearTimeout(timer);
  }, [safeMessages]);

  const { typingState, selectedConversation } = useConversation();
  const typingInfo =
    selectedConversation &&
    selectedConversation._id &&
    typingState
      ? typingState[selectedConversation._id]
      : null;

  return (
    <div
      className="
        flex-1
        overflow-y-auto
        bg-[#0b1120]
        py-20
      "
      style={{ minHeight: "calc(92vh - 8vh)" }}
    >
      {loading ? (
        <Loading />
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
      {typingInfo && typingInfo.typing && (
        <div className="px-8 py-4 text-sm text-gray-400 animate-pulse">
          Typing...
        </div>
      )}

      {!loading && safeMessages.length === 0 && (
       <p className="text-center mt-[20%] text-gray-500 text-md">
  No messages yet. Start conversation or use @ai
</p>
      )}
    </div>
  );
}

export default Messages;

