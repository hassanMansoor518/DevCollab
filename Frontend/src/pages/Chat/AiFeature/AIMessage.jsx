// AIMessage.jsx
import React from "react";
import { Bot, User, Sparkles } from "lucide-react";

function AIMessage({ message }) {
  const text =
    typeof message.message === "string"
      ? message.message
      : message.message?.message || "";

  return (
    <div
      className={`flex w-full ${message.isAI ? "justify-start" : "justify-end"
        }`}
    >
      <div
        className={`flex gap-3 max-w-[85%] ${message.isAI ? "flex-row" : "flex-row-reverse"
          }`}
      >
        {/* Avatar */}
        <div
          className={` 
          ${message.isAI
              ? "w-17 rounded-2xl flex items-center justify-center shadow-md border h-10 bg-gradient-to-br from-violet-600 to-blue-600 border-violet-500/30"
              : ""
            }`}
        >
          {message.isAI ? (<Bot size={18} className="text-white" />
          ) : ("")}
        </div>

        {/* Message Bubble */}
        <div
          className={`relative  rounded-3xl shadow-lg border backdrop-blur-sm transition-all duration-300
      ${message.isAI
              ? "px-5 py-4 bg-[#111827]/95 text-gray-200 border-gray-700"
              : "px-7 py-2 bg-gradient-to-br from-blue-600 to-blue-500 text-white border-blue-400/30"
            }`}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            {message.isAI && (
              <>
                <Sparkles size={14} className="text-violet-400" />
                <span className="text-xs font-semibold text-violet-300 tracking-wide uppercase">
                  AI Assistant
                </span>
              </>
            )}


          </div>

          {/* Text */}
          <div className="text-sm leading-7 whitespace-pre-wrap break-words">
            {text}
          </div>

          {/* Glow Effect */}
          {message.isAI && (
            <div className="absolute inset-0 rounded-3xl bg-violet-500/5 pointer-events-none" />
          )}
        </div>
      </div>
    </div>


  );
}

export default AIMessage;
