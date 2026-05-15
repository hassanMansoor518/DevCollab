import React from "react";

function AIMessage({ message }) {
 const text =
  typeof message.message === "string"
    ? message.message
    : message.message?.message || "";

  return (
    <div className={`flex w-full ${message.isAI ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap
        ${message.isAI ? "bg-[#111827] text-gray-200" : "bg-blue-600 text-white"}`}
      >
        {message.isAI && (
          <div className="text-xs text-gray-400 mb-1">AI Assistant</div>
        )}

        {text}
      </div>
    </div>
  );
}

export default AIMessage;