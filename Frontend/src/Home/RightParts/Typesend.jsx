import React, { useState, useRef } from "react";
import { useSocketContext } from "../../context/SocketContext.jsx";
import useSendMessage from "../../context/useSendMessage.js";
import useSendAiMessage from "../../context/useSendAiMessage.jsx";
import useConversation from "../../zustand/useConversation.js";
import { useAuth } from "../../context/AuthProvider.jsx";

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

    // determine receiver id (other member in conversation)
    const myId = authUser.user._id;
    const receiverId = selectedConversation.members
      ? selectedConversation.members.find((m) => m.toString() !== myId.toString())
      : null;

    if (!receiverId) return;

    socket.emit('typing', { to: receiverId.toString(), conversationId: selectedConversation._id, typing: isTyping });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    // Always send the normal user message
    await sendMessages(text);

    // If message contains @Ai (case-insensitive), call AI with the rest of the prompt
    const aiTagMatch = text.match(/@ai\b/i);
    if (aiTagMatch) {
      // Remove the @Ai tag from the prompt
      const prompt = text.replace(/@ai\b/i, "").trim();
      if (prompt) {
        await sendAiMessage(prompt);
      }
    }

    setText("");
    setTyping(false);
    emitTyping(false);
  };

  const handleChange = (e) => {
    setText(e.target.value);

    // emit typing true
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
      className="flex items-center gap-2 p-3 bg-slate-800"
    >
      <input
        type="text"
        value={text}
        onChange={handleChange}
        placeholder="Type a message..."
        className="flex-1 px-4 py-2 rounded bg-slate-700 text-white outline-none"
      />

      {/* typing icon when user typing */}
      <div className="flex items-center gap-2">
        {typing && (
          <div className="text-gray-300 text-sm px-2 py-1 rounded bg-slate-700 flex items-center">
            <svg className="h-4 w-4 animate-pulse mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="5" cy="12" r="2" fill="currentColor" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <circle cx="19" cy="12" r="2" fill="currentColor" />
            </svg>
            Typing
          </div>
        )}

        <button
          type="submit"
          disabled={msgLoading || aiLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </form>
  );
}

export default Typesend;

