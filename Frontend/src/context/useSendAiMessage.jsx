import { useState } from "react";
import useConversation from "../zustand/useConversation.js";
import axios from "axios";

const useSendAiMessage = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessage, selectedConversation } = useConversation();

  const sendAiMessage = async (prompt) => {
    setLoading(true);
    try {
      // call AI backend endpoint (proxied via Vite dev server) and include conversation id
      const res = await axios.get(`/api/ai/get-result`, { params: { prompt, conversationId: selectedConversation._id } });

      // use the saved message returned from backend
      const savedMessage = res.data;

      setMessage([...messages, savedMessage]); // append AI response
      setLoading(false);
    } catch (error) {
      console.log("Error in sending AI message", error);
      setLoading(false);
    }
  };

  return { loading, sendAiMessage };
};

export default useSendAiMessage;


