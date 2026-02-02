import React, { useState } from "react";
import useSendMessage from "../../context/useSendMessage.js";
import useSendAiMessage from "../../context/useSendAiMessage.jsx";

function Typesend() {
  const [text, setText] = useState("");
  const { sendMessages, loading: msgLoading } = useSendMessage();
  const { sendAiMessage, loading: aiLoading } = useSendAiMessage();

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
  };

  return (
    <form
      onSubmit={handleSend}
      className="flex items-center gap-2 p-3 bg-slate-800"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 px-4 py-2 rounded bg-slate-700 text-white outline-none"
      />

      <button
        type="submit"
        disabled={msgLoading || aiLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        Send
      </button>
    </form>
  );
}

export default Typesend;

