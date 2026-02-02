import React, { useEffect, useRef } from "react";
import Message from "./Message.jsx";
import useGetMessage from "../../context/useGetMessage.jsx";
import Loading from "../../component/Loading.jsx";

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

      {!loading && safeMessages.length === 0 && (
        <div>
          <p className="text-center mt-[20%]">Say! Hi to start the conversation</p>
        </div>
      )}
    </div>
  );
}

export default Messages;
