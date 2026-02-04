import { useEffect } from "react";
import { useSocketContext } from "./SocketContext";
import useConversation from "../zustand/useConversation.js";
import sound from "../assets/notification.mp3";

const useGetSocketMessage = () => {
  const { socket } = useSocketContext();
  const {
    messages,
    setMessage,
    selectedConversation,
    setTypingState,
    setOnlineUsers, // new: Zustand state for online users
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
        const notification = new Audio(sound);
        notification.play();
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
      setOnlineUsers(users); // users = array of online userIds
    };

    // ====== Socket Listeners ======
    socket.on("newMessage", messageHandler);
    socket.on("typing", typingHandler);
    socket.on("updateUsers", onlineHandler); // new listener

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
    setOnlineUsers, // include new setter
  ]);
};

export default useGetSocketMessage;
