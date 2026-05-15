import { useState } from "react";
import axios from "axios";
import useAIMessages from "../context/useAIMessages";

const useSendAiMessage = () => {
  const [loading, setLoading] = useState(false);

  const { addMessage, addTempMessage, replaceTempMessage } =
    useAIMessages();

  const sendAiMessage = async (prompt) => {
    if (!prompt.trim()) return;

    setLoading(true);

    // 1. user message
    addMessage(prompt, false);

    // 2. temp AI message
    const tempId = addTempMessage();

    try {
      const res = await axios.get(
        "http://localhost:3001/api/ai/get-result",
        {
          params: { prompt },
          withCredentials: true,
        }
      );

      // ✅ FIXED KEY HERE
      const aiText = res.data?.message;

      replaceTempMessage(tempId, aiText || "No response");

    } catch (error) {
      console.error("AI Error:", error);

      replaceTempMessage(
        tempId,
        "Failed to get AI response. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return { loading, sendAiMessage };
};

export default useSendAiMessage;