import React from "react";

function Message({ message }) {
  const authUser = JSON.parse(localStorage.getItem("ChatApp"));
  const itsMe = message.senderId === authUser.user._id;

  const chatName = itsMe ? "chat-end" : "chat-start";
  const chatColor = itsMe ? "bg-blue-500 text-white" : "bg-green-300 text-black";

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="px-4 py-1">
      <div className={`chat ${chatName}`}>
        <div
          className={`
            chat-bubble
            ${chatColor}
            max-w-[65%]
          
            whitespace-pre-wrap
          `}
        >
          {message.message}
        </div>

        <div className="chat-footer opacity-60 text-xs">
          {formattedTime}
        </div>
      </div>
    </div>
  );
}

export default Message;
