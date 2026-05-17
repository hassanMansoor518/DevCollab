// AIMessages.jsx
import React, { useEffect, useRef } from "react";
import useAIMessages from "../../../context/useAIMessages.js";
import AIMessage from "./AIMessage.jsx";
import { Bot } from "lucide-react";

function AIMessages() {
  const aiMessages = useAIMessages((state) => state.aiMessages);
  const lastRef = useRef(null);

  useEffect(() => {
    lastRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [aiMessages]);

  return (<div className="flex flex-col gap-5 px-2 py-4">
    {aiMessages.length === 0 && (<div className="flex flex-col items-center justify-center py-20 text-center"> <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-2xl mb-5"> <Bot size={38} className="text-white" /> </div>

      ```
      <h2 className="text-2xl font-bold text-white mb-2">
        DevCollab AI Assistant
      </h2>

      <p className="text-gray-400 max-w-md leading-7">
        Repository-aware AI engineering assistant.
        Ask about architecture, bugs, APIs, commits, database models,
        GitHub integration, or project files.
      </p>
    </div>
    )}

    {aiMessages.map((msg) => (
      <div key={msg._id || Math.random()} ref={lastRef}>
        <AIMessage message={msg} />
      </div>
    ))}
  </div>


  );
}

export default AIMessages;
