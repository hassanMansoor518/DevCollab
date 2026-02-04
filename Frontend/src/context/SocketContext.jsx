import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthProvider";

const SocketContext = createContext(null);
export const useSocketContext = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { authUser } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    // create socket once
    if (!socketRef.current) {
      const socket = io("http://localhost:3001", {
        withCredentials: true,
        autoConnect: true, // 🔑 ensure auto reconnect
        transports: ["websocket"],
      });

      socketRef.current = socket;

      socket.on("connect", () => console.log("✅ Socket connected:", socket.id));
      socket.on("disconnect", (reason) => console.log("❌ Socket disconnected:", reason));
      socket.on("onlineUsers", (users) => setOnlineUsers(users));

      socket.onAny((event, data) => console.log("📡 socket event:", event, data));
    }

    // only if user exists, emit auth/login event
    if (authUser?.user?._id && socketRef.current.connected) {
      socketRef.current.emit("authenticate", { userId: authUser.user._id });
    }

    return () => {
      // optional: cleanup listeners, do NOT disconnect to allow auto reconnect
      if (socketRef.current) socketRef.current.off();
    };
  }, [authUser]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
