import { useState } from "react";
import useConversation from "../zustand/useConversation.js";
import axios from "axios";

const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessage, selectedConversation, selectedWorkspace } = useConversation();

  const sendMessages = async (message) => {
    setLoading(true);
    try {
      let res;

      if (selectedWorkspace && !selectedConversation) {
        res = await axios.post(
          `/api/workspace/message/send/${selectedWorkspace._id}`,
          { message },
          { withCredentials: true }
        );
      } else if (selectedConversation) {
        res = await axios.post(
          `/api/message/send/${selectedConversation._id}`,
          { message },
          { withCredentials: true }
        );
      } else {
        console.warn("No conversation or workspace selected");
        return;
      }

      setMessage([...messages, res.data]);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.warn("Conversation not found or invalid ID.");
      } else {
        console.error("Error in send messages", error);
      }
    } finally {
      setLoading(false);
    }
  };

  return { loading, sendMessages };
};

export default useSendMessage;