import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthProvider";
import useConversation from "../zustand/useConversation.js";
import useAIMessages from "./useAIMessages";

const SocketContext = createContext(null);
export const useSocketContext = () => useContext(SocketContext);

// Synthesize a beautiful, premium glass dual-tone chime natively using the Web Audio API.
// This completely avoids missing asset file import compile errors!
const playSaaSPing = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Tone 1 (High bell sound)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.15);

    // Tone 2 (Higher harmony chime, slightly delayed)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.07); // D6 note (gorgeous harmony)
    gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    
    osc2.start(ctx.currentTime + 0.07);
    osc2.stop(ctx.currentTime + 0.25);
  } catch (err) {
    console.warn("Web Audio chime failed:", err);
  }
};

export const SocketProvider = ({ children }) => {
  const [authUser] = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // 1. Only connect when user is logged in
    if (authUser?.user?._id) {
      console.log("🔌 Initializing socket for user:", authUser.user._id);

      const newSocket = io("http://localhost:3001", {
        withCredentials: true,
        autoConnect: true,
        transports: ["websocket"],
        query: {
          userId: authUser.user._id,
        },
      });

      setSocket(newSocket);

      // ====== SOCKET EVENT LISTENERS ======
      newSocket.on("connect", () => {
        console.log("✅ Socket connected:", newSocket.id);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason);
      });

      // Update online users list
      newSocket.on("onlineUsers", (users) => {
        console.log("📡 Online users updated:", users);
        setOnlineUsers(users);
      });

      // Handle direct messages
      newSocket.on("newMessage", ({ message, conversationId }) => {
        const store = useConversation.getState();

        // If it's for the currently active DM conversation, append to list
        if (store.selectedConversation?._id?.toString() === conversationId) {
          store.setMessage([...store.messages, message]);
          
          // Play premium synthesized glass chime
          playSaaSPing();
        }

        // If it's an AI message, add it to AI assistant history
        if (message?.isAI) {
          const aiStore = useAIMessages.getState();
          aiStore.addMessage(message.message, true);
        }
      });

      // Handle workspace channel messages
      newSocket.on("newWorkspaceMessage", ({ message, workspaceId }) => {
        const store = useConversation.getState();

        // If it's for the currently active workspace, append to list
        if (store.selectedWorkspace?._id?.toString() === workspaceId && !store.selectedConversation) {
          store.setMessage([...store.messages, message]);

          // Play premium synthesized glass chime
          playSaaSPing();
        }
      });

      // Handle real-time typing indicators
      newSocket.on("typing", ({ conversationId, from, typing }) => {
        const store = useConversation.getState();
        if (store.selectedConversation?._id?.toString() === conversationId) {
          store.setTypingState(conversationId, typing, from || null);
          
          // Safety timeout to clear indicator
          if (!typing) {
            setTimeout(() => {
              store.setTypingState(conversationId, false, null);
            }, 500);
          }
        }
      });

      newSocket.onAny((event, data) => {
        console.log(`📡 Incoming socket event: ${event}`, data);
      });

      // Cleanup on logout or unmount
      return () => {
        console.log("🔌 Disconnecting socket for user:", authUser.user._id);
        newSocket.close();
        setSocket(null);
      };
    } else {
      // User is logged out, ensure socket is closed
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [authUser?.user?._id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};