import { useEffect, useState } from "react";
import useConversation from "../zustand/useConversation.js";
import axios from "axios";

const useGetMessage = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessage, selectedConversation } = useConversation();



  // ✅ FETCH EFFECT
  useEffect(() => {
    const getMessages = async () => {
     
      if (selectedConversation && selectedConversation._id)

      try {    
        const res = await axios.get(
          `/api/message/get/${selectedConversation._id}`,
          { withCredentials: true } // ✅ important
        );
        
        setMessage(res.data);
        setLoading(false);
      } catch (error) {
        console.log("Error in getting messages", error);
      }
    };

    getMessages();
  }, [selectedConversation?._id, setMessage]);

  return { loading, messages };
};

export default useGetMessage;
