import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthProvider";
import useConversation from "../zustand/useConversation.js";

const SocketContext = createContext(null);
export const useSocketContext = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [authUser] = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!socketRef.current) {
      const socket = io("http://localhost:3001", {
        withCredentials: true,
        autoConnect: true,
        transports: ["websocket"],
      });

      socketRef.current = socket;

      socket.on("connect", () => console.log("✅ Socket connected:", socket.id));
      socket.on("disconnect", (reason) => console.log("❌ Socket disconnected:", reason));
      socket.on("onlineUsers", (users) => setOnlineUsers(users));

      // ✅ New workspace message via socket
      socket.on("newWorkspaceMessage", ({ message, workspaceId }) => {
        const store = useConversation.getState();

        if (store.selectedWorkspace?._id?.toString() === workspaceId) {
          store.setMessage([...store.messages, message]);
        }
      });

      socket.on("newMessage", ({ message, conversationId }) => {
        const store = useConversation.getState();

        if (store.selectedConversation?._id?.toString() === conversationId) {
          store.setMessage([...store.messages, message]);
        }

        // ✅ IMPORTANT: AI message handling
        if (message?.isAI) {
          const aiStore = useAIMessages.getState();
          aiStore.addMessage(message.message, true);
        }
      });

      // ✅ New DM message via socket
      socket.on("newMessage", ({ message, conversationId }) => {
        const { selectedConversation, messages, setMessage } = useConversation.getState();
        if (selectedConversation?._id?.toString() === conversationId) {
          setMessage([...messages, message]);
        }
      });

      socket.onAny((event, data) => console.log("📡 socket event:", event, data));
    }

    if (authUser?.user?._id && socketRef.current?.connected) {
      socketRef.current.emit("authenticate", { userId: authUser.user._id });
    }

    return () => {
      if (socketRef.current) socketRef.current.off();
    };
  }, [authUser]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};