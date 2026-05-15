import React, { useEffect, useRef } from "react";
import useAIMessages from "../../../context/useAIMessages.js";
import AIMessage from "./AIMessage.jsx";

function AIMessages() {
  const aiMessages = useAIMessages((state) => state.aiMessages);
  const lastRef = useRef(null);

  useEffect(() => {
    lastRef.current?.scrollIntoView({ behavior: "smooth" });
    console.log("AI Messages updated:", aiMessages);
  }, [aiMessages]);

  return (
    <div className="space-y-3">
      {aiMessages.length === 0 && (
        <p className="text-center text-gray-500 mt-10">
          Start chatting with AI...
        </p>
      )}

      {aiMessages.map((msg) => (
        <div key={msg._id} ref={lastRef}>
          <AIMessage message={msg} />
        </div>
      ))}
    </div>
  );
}

export default AIMessages;