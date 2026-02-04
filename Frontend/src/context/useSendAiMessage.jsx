import { useState } from "react";
import useConversation from "../zustand/useConversation.js";
import axios from "axios";

const useSendAiMessage = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessage, selectedConversation } = useConversation();

  const sendAiMessage = async (prompt) => {
    setLoading(true);
    try {
      // Create a temporary 'AI thinking' message locally so user sees feedback
      const tempId = `ai-temp-${Date.now()}`;
      const tempMessage = {
        _id: tempId,
        senderId: 'ai',
        message: 'AI is thinking...',
        isAI: true,
        pending: true,
        createdAt: new Date().toISOString(),
      };

      setMessage([...messages, tempMessage]);

      // call AI backend endpoint (proxied via Vite dev server) and include conversation id
      const res = await axios.get(`/api/ai/get-result`, { params: { prompt, conversationId: selectedConversation._id } });

      // use the saved message returned from backend
      const savedMessage = res.data;

      // Replace temporary message with saved message
      const withoutTemp = (messages || []).filter((m) => !(m._id && m._id.toString().startsWith('ai-temp-')));
      setMessage([...withoutTemp, savedMessage]);

      setLoading(false);
    } catch (error) {
      console.log("Error in sending AI message", error);
      // remove temp message on error
      const withoutTemp = (messages || []).filter((m) => !(m._id && m._id.toString().startsWith('ai-temp-')));
      setMessage(withoutTemp);
      setLoading(false);
    }
  };

  return { loading, sendAiMessage };
};

export default useSendAiMessage;


