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

export const getFriendlyMediaErrorMessage = (err) => {
  const message = err?.message || err?.name || "Unknown error";
  const lowerMessage = message.toLowerCase();

  // 1. Detect non-secure context
  const isSecure = window.isSecureContext;

  // 2. Detect in-app browsers
  const ua = navigator.userAgent || navigator.vendor || window.opera || "";
  const isInApp = /FBAN|FBAV|Instagram|Threads|Line|Twitter|Pinterest|Snapchat|GSA/i.test(ua);

  // Build descriptive error message
  let errorText = `Microphone/Camera access failed: ${message}.\n\n`;

  if (isInApp) {
    errorText += "⚠️ You are currently using an in-app browser (like Facebook/Instagram/TikTok) which blocks access to the microphone and camera.\n\n👉 How to fix:\n1. Tap the menu/options icon (usually 3 dots '...' or sharing icon) at the top or bottom of your screen.\n2. Choose 'Open in Chrome' or 'Open in Safari' to use your default browser.";
  } else if (!isSecure) {
    errorText += "🔒 Secure Context Required:\nBrowser security policies block camera and microphone access on non-secure connections (HTTP).\n\n👉 How to fix:\nPlease access the application using HTTPS (e.g., https://...) or via localhost (e.g., http://localhost:...) for development.";
  } else {
    // Standard browser, secure context, but permission was denied or device is not found
    if (lowerMessage.includes("permission") || lowerMessage.includes("allowed") || lowerMessage.includes("denied") || lowerMessage.includes("notallowed")) {
      errorText += "🚫 Permission Denied:\nIt looks like microphone/camera access was blocked for this site.\n\n👉 How to fix:\n1. Click the site settings icon (padlock, camera, or mic icon) in your browser's address bar (next to the website URL).\n2. Change the permission for Microphone and Camera to 'Allow'.\n3. Reload the page and try calling again.";
    } else if (lowerMessage.includes("not found") || lowerMessage.includes("device") || lowerMessage.includes("requested device not found") || lowerMessage.includes("notfound")) {
      errorText += "🔌 Device Not Found:\nNo microphone or camera could be detected on your device.\n\n👉 How to fix:\nPlease plug in a microphone or camera, or check if they are disabled in your operating system's settings.";
    } else {
      errorText += "👉 How to fix:\nPlease check your browser's site settings, ensure your microphone/camera are correctly connected, and reload the page.";
    }
  }

  return errorText;
};

