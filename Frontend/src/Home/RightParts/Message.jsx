import React from "react";

function Message({ message }) {
  const authUser = JSON.parse(localStorage.getItem("ChatApp"));
  const itsMe = (message.senderId && message.senderId.toString ? message.senderId.toString() : message.senderId) === authUser.user._id;

  const chatName = itsMe ? "chat-end" : "chat-start";

  // AI messages have different styling
  const chatColor = message.isAI ? "bg-gray-800 text-white" : itsMe ? "bg-blue-500 text-white" : "bg-green-300 text-black";

  const formattedTime = message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }) : "";

  // AI thinking spinner for pending AI message
  const AiSpinner = () => (
    <span className="inline-flex items-center space-x-1">
      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
      <span className="text-sm">Thinking...</span>
    </span>
  );

  const AiIcon = () => (
    <span className="mr-2 text-sm">🤖</span>
  );

  return (
    <div className="px-4 py-1">
      <div className={`chat ${chatName}`}>
        <div
          className={`
            chat-bubble
            ${chatColor}
            max-w-[65%]
            whitespace-pre-wrap
            flex items-center
          `}
        >
          {/* AI icon */}
          {message.isAI && <AiIcon />}

          {/* Pending AI shows spinner and message text */}
          {message.isAI && message.pending ? (
            <AiSpinner />
          ) : (
            <span>{message.message}</span>
          )}
        </div>

        <div className="chat-footer opacity-60 text-xs">
          {formattedTime}
        </div>
      </div>
    </div>
  );
}

export default Message;
