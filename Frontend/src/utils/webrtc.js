export const STUN_SERVERS = [
  {
    urls: [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302",
      "stun:stun2.l.google.com:19302",
    ],
  },
];

export const createPeerConnection = ({ onIceCandidate, onTrack, onConnectionStateChange }) => {
  const connection = new RTCPeerConnection({ iceServers: STUN_SERVERS });

  connection.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate?.(event.candidate);
    }
  };

  connection.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      onTrack?.(event.streams[0]);
    }
  };

  connection.onconnectionstatechange = () => {
    onConnectionStateChange?.(connection.connectionState);
  };

  return connection;
};

export const getLocalMediaStream = async (callType) => {
  const constraints = {
    audio: true,
    video:
      callType === "video"
        ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          }
        : false,
  };

  return await navigator.mediaDevices.getUserMedia(constraints);
};
