import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useAuth } from "./AuthProvider";
import { io } from "socket.io-client";

const socketContext = createContext();

export const useSocketContext = () => useContext(socketContext);

export const SocketProvider = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [authUser] = useAuth();
  const socketRef = useRef(null); // useRef to keep the same socket

  useEffect(() => {
    // Only connect if authUser exists and no socket exists yet
    if (authUser?.user?._id && !socketRef.current) {
      const socketInstance = io("http://localhost:3001", {
        query: {
          userId: authUser.user._id,
        },
        transports: ["websocket"], // avoid polling issues
      });

      socketRef.current = socketInstance;

      socketInstance.on("connect", () => {
        console.log("Socket connected:", socketInstance.id);
      });

      socketInstance.on("disconnect", () => {
        console.log("Socket disconnected:", socketInstance.id);
      });

      socketInstance.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      // Cleanup only on unmount
      return () => {
        socketInstance.disconnect();
        socketRef.current = null;
      };
    }
  }, [authUser]);

  return (
    <socketContext.Provider value={{ socket: socketRef.current, onlineUsers }}>
      {children}
    </socketContext.Provider>
  );
};
