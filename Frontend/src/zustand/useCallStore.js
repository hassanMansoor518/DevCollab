import { create } from "zustand";

const initialCallState = {
  callStatus: "idle",
  callType: null,
  callId: null,
  isCaller: false,
  remoteUser: null,
  conversationId: null,
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  micMuted: false,
  cameraOff: false,
  speakerOn: true,
  callStartTime: null,
  callMessage: null,
  callError: null,
};

const stopMediaStream = (stream) => {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    try {
      track.stop();
    } catch (error) {
      console.warn("Failed to stop track", error);
    }
  });
};

const cleanupPeerConnection = (peerConnection) => {
  if (!peerConnection) return;
  try {
    peerConnection.onicecandidate = null;
    peerConnection.ontrack = null;
    peerConnection.onconnectionstatechange = null;
    peerConnection.close();
  } catch (error) {
    console.warn("Failed to cleanup peer connection", error);
  }
};

const useCallStore = create((set, get) => ({
  ...initialCallState,

  startOutgoingCall: ({ callId, callType, remoteUser, conversationId }) =>
    set({
      callStatus: "outgoing",
      callType,
      callId,
      remoteUser,
      conversationId,
      isCaller: true,
      callStartTime: Date.now(),
      callMessage: "Calling...",
      callError: null,
    }),

  receiveIncomingCall: ({ callId, callType, caller, conversationId }) =>
    set({
      callStatus: "incoming",
      callType,
      callId,
      remoteUser: caller,
      conversationId,
      isCaller: false,
      callStartTime: Date.now(),
      callMessage: "Incoming call",
      callError: null,
    }),

  setLocalStream: (localStream) => set({ localStream }),
  setRemoteStream: (remoteStream) => set({ remoteStream }),
  setPeerConnection: (peerConnection) => set({ peerConnection }),
  setCallStatus: (callStatus) => set({ callStatus }),
  setCallMessage: (callMessage) => set({ callMessage }),
  setCallError: (callError) => set({ callError }),
  setSpeakerOn: (speakerOn) => set({ speakerOn }),

  toggleMic: () =>
    set((state) => {
      const stream = state.localStream;
      if (stream) {
        stream.getAudioTracks().forEach((track) => {
          track.enabled = state.micMuted;
        });
      }
      return { micMuted: !state.micMuted };
    }),

  toggleCamera: () =>
    set((state) => {
      const stream = state.localStream;
      if (stream) {
        stream.getVideoTracks().forEach((track) => {
          track.enabled = state.cameraOff;
        });
      }
      return { cameraOff: !state.cameraOff };
    }),

  resetCall: () => {
    const { localStream, remoteStream, peerConnection } = get();
    stopMediaStream(localStream);
    stopMediaStream(remoteStream);
    cleanupPeerConnection(peerConnection);
    set({ ...initialCallState });
  },
}));

export default useCallStore;
