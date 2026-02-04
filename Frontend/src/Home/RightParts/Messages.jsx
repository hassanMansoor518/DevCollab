import React, { useEffect, useRef } from "react";
import Message from "./Message.jsx";
import useGetMessage from "../../context/useGetMessage.jsx";
import Loading from "../../component/Loading.jsx";
import useConversation from "../../zustand/useConversation.js";

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
  const typingInfo = (selectedConversation && selectedConversation._id && typingState) ? typingState[selectedConversation._id] : null;

  return (
    <div className="flex-1 overflow-y-auto" 
    style={{ minHeight: "calc(92vh - 8vh)" }}>
      {loading ? (
        <Loading />
      ) : (
        safeMessages.length > 0 &&
        safeMessages.map((message, index) => (
          <div
            key={message._id || index}
            ref={index === safeMessages.length - 1 ? lastMsgRef : null}
          >
            <Message message={message} />
          </div>
        ))
      )}

      {/* Typing indicator for the other user in the currently open conversation */}
      {typingInfo && typingInfo.typing && (
        <div className="px-4 py-2 text-sm text-gray-300">
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4 animate-pulse text-gray-300" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="4" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="20" cy="12" r="2" /></svg>
            Typing...
          </span>
        </div>
      )}

      {!loading && safeMessages.length === 0 && (
        <div>
          <p className="text-center mt-[20%]">Say! Hi to start the conversation</p>
        </div>
      )}
    </div>
  );
}

export default Messages;
