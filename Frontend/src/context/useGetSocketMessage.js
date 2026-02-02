import React, { useEffect } from "react";
import { useSocketContext } from "./SocketContext";
import useConversation from "../zustand/useConversation.js";
import sound from "../assets/notification.mp3";
const useGetSocketMessage = () => {
  const { socket } = useSocketContext();
  const { messages, setMessage, selectedConversation } = useConversation();

  useEffect(() => {
    if (!socket) return;

    const handler = (payload) => {
      const { message: incomingMessage, conversationId } = payload || {};

      // Only append if the incoming message belongs to the currently open conversation
      if (selectedConversation && selectedConversation._id && conversationId === selectedConversation._id) {
        const notification = new Audio(sound);
        notification.play();
        setMessage([...messages, incomingMessage]);
      }
    };

    socket.on("newMessage", handler);
    return () => {
      socket.off("newMessage", handler);
    };
  }, [socket, messages, setMessage, selectedConversation]);
};
export default useGetSocketMessage;