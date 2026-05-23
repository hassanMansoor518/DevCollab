import { useEffect } from "react";
import { useSocketContext } from "./SocketContext";
import useConversation from "../zustand/useConversation.js";

const useGetSocketMessage = () => {
  const { socket } = useSocketContext();
  const {
    messages,
    setMessage,
    selectedConversation,
    setTypingState,
    setOnlineUsers,
  } = useConversation();

  useEffect(() => {
    if (!socket) return;

    // ====== 1️⃣ Handle Incoming Messages ======
    const messageHandler = (payload) => {
      const { message: incomingMessage, conversationId } = payload || {};

      if (
        selectedConversation &&
        selectedConversation._id &&
        conversationId === selectedConversation._id
      ) {
        setMessage([...messages, incomingMessage]);
      }
    };

    // ====== 2️⃣ Handle Typing Indicator ======
    const typingHandler = (payload) => {
      const { conversationId, from, typing } = payload || {};
      if (
        selectedConversation &&
        selectedConversation._id &&
        conversationId === selectedConversation._id
      ) {
        setTypingState(conversationId, typing, from || null);

        if (!typing) {
          setTimeout(() => setTypingState(conversationId, false, null), 300);
        }
      }
    };

    // ====== 3️⃣ Handle Online Users ======
    const onlineHandler = (users) => {
      setOnlineUsers(users);
    };

    // ====== Socket Listeners ======
    socket.on("newMessage", messageHandler);
    socket.on("typing", typingHandler);
    socket.on("updateUsers", onlineHandler);

    return () => {
      socket.off("newMessage", messageHandler);
      socket.off("typing", typingHandler);
      socket.off("updateUsers", onlineHandler);
    };
  }, [
    socket,
    messages,
    setMessage,
    selectedConversation,
    setTypingState,
    setOnlineUsers,
  ]);
};

export default useGetSocketMessage;
