import { useEffect, useState } from "react";
import useConversation from "../zustand/useConversation.js";
import axios from "axios";

const useGetMessage = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessage, selectedConversation, selectedWorkspace } = useConversation();

  useEffect(() => {
    const getMessages = async () => {
      setLoading(true);
      try {
        let res;

        if (selectedWorkspace && !selectedConversation) {
          res = await axios.get(
            `/api/workspace/message/get/${selectedWorkspace._id}`,
            { withCredentials: true }
          );
        } else if (selectedConversation?._id) {
          res = await axios.get(
            `/api/message/get/${selectedConversation._id}`,
            { withCredentials: true }
          );
        } else {
          setMessage([]);
          setLoading(false);
          return;
        }

        setMessage(res.data);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setMessage([]);
        } else {
          console.error("Error in getting messages", error);
        }
      } finally {
        setLoading(false);
      }
    };

    getMessages();
  }, [selectedConversation?._id, selectedWorkspace?._id]);

  return { loading, messages };
};

export default useGetMessage;