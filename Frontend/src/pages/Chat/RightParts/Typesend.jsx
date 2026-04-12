import React, { useState, useRef } from "react";
import { useSocketContext } from "../../../context/SocketContext.jsx";
import useSendMessage from "../../../context/useSendMessage.js";
import useSendAiMessage from "../../../context/useSendAiMessage.jsx";
import useConversation from "../../../zustand/useConversation.js";
import { useAuth } from "../../../context/AuthProvider.jsx";

import { FiSmile, FiAtSign } from "react-icons/fi";
import { IoSend } from "react-icons/io5";
import { HiPlus } from "react-icons/hi";

function Typesend() {
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const typingTimeout = useRef(null);

  const { socket } = useSocketContext();
  const { sendMessages, loading: msgLoading } = useSendMessage();
  const { sendAiMessage, loading: aiLoading } = useSendAiMessage();
  const { selectedConversation } = useConversation();
  const [authUser] = useAuth();

  const emitTyping = (isTyping) => {
    if (!socket || !selectedConversation || !selectedConversation._id) return;

    const myId = authUser.user._id;
    const receiverId = selectedConversation.members
      ? selectedConversation.members.find(
          (m) => m.toString() !== myId.toString()
        )
      : null;

    if (!receiverId) return;

    socket.emit("typing", {
      to: receiverId.toString(),
      conversationId: selectedConversation._id,
      typing: isTyping,
    });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    await sendMessages(text);

 if (text.toLowerCase().includes("@ai")) {
  const prompt = text.replace(/@ai/i, "").trim();

  if (prompt) {
    await sendAiMessage({
      prompt,
      projectId: selectedConversation?.projectId || null
    });
  }
}

    setText("");
    setTyping(false);
    emitTyping(false);
  };

  const handleChange = (e) => {
    setText(e.target.value);
    setTyping(true);
    emitTyping(true);

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setTyping(false);
      emitTyping(false);
    }, 800);
  };

  return (
    <form
      onSubmit={handleSend}
      className="px-6 py-4 border-t border-[#1f2937] bg-[#0b1120]"
    >
      <div className="
        flex items-center
        bg-[#111827]
        border border-[#1f2937]
        rounded-xl
        px-4 py-3
        shadow-inner
      ">
        {/* + Button */}
        <button
          type="button"
          className="text-gray-400 hover:text-gray-200 mr-3 transition"
        >
          <HiPlus size={20} />
        </button>

        {/* Emoji */}
        <button
          type="button"
          className="text-gray-400 hover:text-gray-200 mr-3 transition"
        >
          <FiSmile size={18} />
        </button>

        {/* @ Mention */}
        <button
          type="button"
          className="text-gray-400 hover:text-gray-200 mr-3 transition"
        >
          <FiAtSign size={18} />
        </button>

        {/* Input */}
        <input
          type="text"
          value={text}
          onChange={handleChange}
          placeholder="Message..."
          className="
            flex-1
            bg-transparent
            outline-none
            text-sm
            text-gray-200
            placeholder-gray-500
          "
        />

        {/* Typing indicator */}
        {typing && (
          <div className="text-gray-400 text-xs mr-3 animate-pulse">
            typing...
          </div>
        )}

        {/* Send Button */}
        <button
          type="submit"
          disabled={msgLoading || aiLoading}
          className="
            ml-2
            w-9 h-9
            flex items-center justify-center
            rounded-full
            bg-blue-600
            hover:bg-blue-500
            transition
            disabled:opacity-40
          "
        >
          <IoSend size={16} className="text-white" />
        </button>
      </div>
    </form>
  );
}

export default Typesend;
