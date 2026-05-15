import React, { useState, useRef, useEffect } from "react";
import { useSocketContext } from "../../../context/SocketContext.jsx";
import useSendMessage from "../../../context/useSendMessage.js";
import useSendAiMessage from "../../../context/useSendAiMessage.jsx";
import useConversation from "../../../zustand/useConversation.js";
import { useAuth } from "../../../context/AuthProvider.jsx";

import { Send, FileUp, Binary, AlertTriangle } from "lucide-react";

function TypeSendAi() {
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const typingTimeout = useRef(null);
  const textareaRef = useRef(null);

  const { socket } = useSocketContext();
  const { sendMessages, loading: msgLoading } = useSendMessage();
  const { sendAiMessage, loading: aiLoading } = useSendAiMessage();
  const { selectedConversation, selectedWorkspace } = useConversation();
  const [authUser] = useAuth();

  /* ================= AUTO RESIZE ================= */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [text]);

  /* ================= TYPING ================= */
  const emitTyping = (isTyping) => {
    if (!socket || !selectedConversation?._id) return;

    const myId = authUser?.user?._id;
    if (!myId) return;

    const receiverId = selectedConversation.members?.find(
      (m) => m.toString() !== myId.toString()
    );

    if (!receiverId) return;

    socket.emit("typing", {
      to: receiverId.toString(),
      conversationId: selectedConversation._id,
      typing: isTyping,
    });
  };

  /* ================= SEND ================= */
  const handleSend = async (e) => {
    e.preventDefault();

    const cleanText = text.trim();
    if (!cleanText) return;

    setText("");
    setTyping(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    if (selectedConversation?._id) emitTyping(false);

    const isAiMessage = cleanText.toLowerCase().includes("@ai");

    try {
      if (isAiMessage) {
        const prompt = cleanText.replace(/@ai/i, "").trim();

        if (prompt) {
          await sendAiMessage(prompt);
        }
      } else {
        await sendMessages(cleanText);
      }
    } catch (err) {
      console.error("Send Error:", err);
    }
  };

  /* ================= INPUT ================= */
  const handleChange = (e) => {
    setText(e.target.value);

    if (!selectedConversation?._id) return;

    setTyping(true);
    emitTyping(true);

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      setTyping(false);
      emitTyping(false);
    }, 800);
  };

  /* ================= PROMPTS ================= */
  const insertPrompt = (type) => {
    let newText = text;

    if (type === "explain") {
      newText += " @ai Explain this code:\n```\n[Insert Code Here]\n```";
    }

    if (type === "bug") {
      newText += " @ai Find bugs in this code:\n```\n[Insert Code Here]\n```";
    }

    setText(newText);
    textareaRef.current?.focus();
  };

  /* ================= PLACEHOLDER ================= */
  const dynamicPlaceholder =
    selectedWorkspace && !selectedConversation
      ? `Ask AI about #${selectedWorkspace.name}... (use @ai)`
      : "Ask AI about code, bugs, architecture... (use @ai)";

  return (
    <form onSubmit={handleSend} className="px-6 py-4">
  <div className="max-w-4xl mx-auto">

    <div className="bg-[#0e1625] border border-[#1f2a44] rounded-lg p-4">

      {/* TEXTAREA */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        placeholder={dynamicPlaceholder}
        className="w-full bg-transparent outline-none text-gray-300 placeholder-gray-500 text-sm resize-none mb-3 min-h-[60px] max-h-[160px]"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            handleSend(e);
          }
        }}
      />

      {/* ACTION ROW */}
      <div className="flex justify-between items-center">

        {/* LEFT */}
        <div className="flex gap-2">

          <button type="button" className="btn-secondary">
            <FileUp size={14} className="text-cyan-400" /> Upload
          </button>

          <button type="button" onClick={() => insertPrompt("explain")} className="btn-secondary">
            <Binary size={14} className="text-cyan-400"/> Explain
          </button>

          <button type="button" onClick={() => insertPrompt("bug")} className="btn-secondary">
            <AlertTriangle size={14} className="text-red-400" /> Bugs
          </button>

        </div>

        {/* SEND */}
        <button
          type="submit"
          disabled={msgLoading || aiLoading}
          className="bg-blue-600 text-white p-2.5 rounded-md hover:opacity-90 disabled:opacity-40"
        >
          <Send size={18} />
        </button>

      </div>
    </div>
  </div>

  <p className="text-center text-[10px] text-gray-600 mt-2">
    AI can make mistakes. Verify outputs.
  </p>
</form>
  );
}

export default TypeSendAi;