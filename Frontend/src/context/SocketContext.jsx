import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthProvider";
import useConversation from "../zustand/useConversation.js";
import useAIMessages from "./useAIMessages";
import useCallStore from "../zustand/useCallStore.js";
import { createPeerConnection, getLocalMediaStream } from "../utils/webrtc.js";

const SocketContext = createContext({ socket: null, onlineUsers: [] });
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

  const {
    receiveIncomingCall,
    setLocalStream,
    setRemoteStream,
    setPeerConnection,
    setCallStatus,
    setCallMessage,
    setCallError,
    resetCall,
  } = useCallStore();

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

      newSocket.on("incoming-call", (payload) => {
        receiveIncomingCall(payload);
      });

      newSocket.on("call-accepted", async ({ callId, from, callType }) => {
        const callState = useCallStore.getState();
        if (!callState.callId || callState.callId !== callId || callState.callStatus !== "outgoing") return;

        try {
          setCallStatus("connecting");
          setCallMessage("Connecting...");
          const stream = await getLocalMediaStream(callType);
          setLocalStream(stream);

          const connection = createPeerConnection({
            onIceCandidate: (candidate) => {
              newSocket.emit("ice-candidate", { to: from, callId, candidate });
            },
            onTrack: (stream) => {
              setRemoteStream(stream);
            },
            onConnectionStateChange: (state) => {
              if (state === "connected") {
                setCallStatus("inCall");
                setCallMessage("Live call");
              }
              if (["disconnected", "failed", "closed"].includes(state)) {
                resetCall();
              }
            },
          });

          stream.getTracks().forEach((track) => connection.addTrack(track, stream));
          setPeerConnection(connection);

          const offer = await connection.createOffer();
          await connection.setLocalDescription(offer);
          newSocket.emit("offer", { to: from, callId, sdp: offer });
        } catch (err) {
          console.error("Failed to create offer", err);
          setCallError("Unable to connect the call. Please try again.");
          resetCall();
        }
      });

      newSocket.on("offer", async ({ callId, sdp, from }) => {
        const callState = useCallStore.getState();
        if (!callState.callId || callState.callId !== callId) return;

        try {
          setCallStatus("connecting");
          setCallMessage("Accepting call...");

          let connection = callState.peerConnection;
          let stream = callState.localStream;

          if (!connection) {
            stream = await getLocalMediaStream(callState.callType);
            setLocalStream(stream);

            connection = createPeerConnection({
              onIceCandidate: (candidate) => {
                newSocket.emit("ice-candidate", { to: from, callId, candidate });
              },
              onTrack: (stream) => {
                setRemoteStream(stream);
              },
              onConnectionStateChange: (state) => {
                if (state === "connected") {
                  setCallStatus("inCall");
                  setCallMessage("Live call");
                }
                if (["disconnected", "failed", "closed"].includes(state)) {
                  resetCall();
                }
              },
            });

            stream.getTracks().forEach((track) => connection.addTrack(track, stream));
            setPeerConnection(connection);
          }

          await connection.setRemoteDescription(sdp);
          const answer = await connection.createAnswer();
          await connection.setLocalDescription(answer);
          newSocket.emit("answer", { to: from, callId, sdp: answer });
        } catch (err) {
          console.error("Failed to handle offer", err);
          setCallError("Could not establish the call.");
          resetCall();
        }
      });

      newSocket.on("answer", async ({ callId, sdp }) => {
        const callState = useCallStore.getState();
        if (!callState.callId || callState.callId !== callId || !callState.peerConnection) return;

        try {
          await callState.peerConnection.setRemoteDescription(sdp);
          setCallStatus("inCall");
          setCallMessage("Live call");
        } catch (err) {
          console.error("Failed to set remote answer", err);
          setCallError("Call setup failed.");
          resetCall();
        }
      });

      newSocket.on("ice-candidate", async ({ callId, candidate }) => {
        const callState = useCallStore.getState();
        if (!callState.callId || callState.callId !== callId || !callState.peerConnection) return;

        try {
          await callState.peerConnection.addIceCandidate(candidate);
        } catch (err) {
          console.warn("Failed to add remote ICE candidate", err);
        }
      });

      newSocket.on("reject-call", ({ callId }) => {
        const callState = useCallStore.getState();
        if (!callState.callId || callState.callId !== callId) return;
        setCallMessage("Call rejected");
        setTimeout(() => resetCall(), 1400);
      });

      newSocket.on("end-call", ({ callId }) => {
        const callState = useCallStore.getState();
        if (!callState.callId || callState.callId !== callId) return;
        setCallMessage("Call ended");
        setTimeout(() => resetCall(), 900);
      });

      newSocket.on("user-busy", ({ callId }) => {
        const callState = useCallStore.getState();
        if (!callState.callId || callState.callId !== callId) return;
        setCallMessage("User is unavailable");
        setTimeout(() => resetCall(), 1400);
      });

      newSocket.on("call-timeout", ({ callId }) => {
        const callState = useCallStore.getState();
        if (!callState.callId || callState.callId !== callId) return;
        setCallMessage("Call timed out");
        setTimeout(() => resetCall(), 1400);
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