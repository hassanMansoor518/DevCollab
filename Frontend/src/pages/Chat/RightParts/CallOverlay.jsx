import React, { useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, PhoneIncoming, Video, VideoOff, Volume2, Maximize2 } from "lucide-react";
import { useSocketContext } from "../../../context/SocketContext.jsx";
import useCallStore from "../../../zustand/useCallStore.js";
import { createPeerConnection, getLocalMediaStream } from "../../../utils/webrtc.js";

const formatDuration = (seconds) => {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
};

function CallOverlay() {
  const {
    callStatus,
    callType,
    callId,
    remoteUser,
    localStream,
    remoteStream,
    micMuted,
    cameraOff,
    speakerOn,
    callMessage,
    callStartTime,
    setLocalStream,
    setRemoteStream,
    setPeerConnection,
    setCallStatus,
    setCallMessage,
    setCallError,
    setSpeakerOn,
    toggleMic,
    toggleCamera,
    resetCall,
  } = useCallStore();

  const { socket } = useSocketContext();
  const [elapsed, setElapsed] = useState(0);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localVideoRef = useRef(null);
  const overlayRef = useRef(null);
  const ringtoneRef = useRef(null);

  const isCallOpen = callStatus !== "idle";

  const callTypeLabel = callType === "video" ? "Video call" : "Audio call";
  const actionLabel = callStatus === "incoming" ? "Incoming" : callStatus === "outgoing" ? "Calling" : "In call";

  useEffect(() => {
    if (callStatus === "incoming" || callStatus === "outgoing") {
      setIsRinging(true);
    } else {
      setIsRinging(false);
    }
  }, [callStatus]);

  useEffect(() => {
    if (isRinging) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.type = "sine";
      oscillator.frequency.value = callStatus === "incoming" ? 520 : 320;
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      oscillator.start();
      ringtoneRef.current = { ctx, oscillator };

      return () => {
        if (ringtoneRef.current) {
          ringtoneRef.current.oscillator.stop();
          ringtoneRef.current.ctx.close();
          ringtoneRef.current = null;
        }
      };
    }

    return undefined;
  }, [isRinging, callStatus]);

  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream]);

  useEffect(() => {
    if (!localStream || !localVideoRef.current) return;
    localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (!callStartTime || callStatus !== "inCall") {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - callStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [callStartTime, callStatus]);

  const resetLocalMedia = () => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const cleanupCall = () => {
    resetCall();
    resetLocalMedia();
  };

  const handleReject = () => {
    if (!socket || !callId || !remoteUser?._id) return;
    socket.emit("reject-call", { callId, to: remoteUser._id });
    cleanupCall();
  };

  const handleEnd = () => {
    if (socket && callId && remoteUser?._id) {
      socket.emit("end-call", { callId, to: remoteUser._id });
    }
    cleanupCall();
  };

  const handleAccept = async () => {
    if (!socket || !callId || !remoteUser?._id) return;

    try {
      setCallMessage("Connecting...");
      setCallStatus("connecting");

      const stream = await getLocalMediaStream(callType);
      setLocalStream(stream);

      const connection = createPeerConnection({
        onIceCandidate: (candidate) => {
          socket.emit("ice-candidate", { to: remoteUser._id, callId, candidate });
        },
        onTrack: (stream) => {
          setRemoteStream(stream);
        },
        onConnectionStateChange: (state) => {
          if (state === "connected") {
            setCallStatus("inCall");
          }
          if (["disconnected", "failed", "closed"].includes(state)) {
            handleEnd();
          }
        },
      });

      stream.getTracks().forEach((track) => connection.addTrack(track, stream));
      setPeerConnection(connection);

      socket.emit("accept-call", { callId, to: remoteUser._id });
    } catch (error) {
      console.error("Accept call failed", error);
      setCallError("Unable to start call. Please allow microphone access.");
      cleanupCall();
    }
  };

  const handleFullscreen = async () => {
    if (!overlayRef.current) return;
    const element = overlayRef.current;
    if (!document.fullscreenElement) {
      await element.requestFullscreen?.();
      setFullscreenActive(true);
    } else {
      await document.exitFullscreen?.();
      setFullscreenActive(false);
    }
  };

  const handleToggleSpeaker = () => {
    setSpeakerOn(!speakerOn);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !speakerOn;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !speakerOn;
    }
  };

  const activeVideoClass = useMemo(() => {
    if (callType === "video" && callStatus === "inCall") {
      return "bg-black";
    }
    return "bg-slate-900";
  }, [callType, callStatus]);

  if (!isCallOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-4 sm:items-center">
      <div ref={overlayRef} className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl">
        <div className="flex flex-col gap-4 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{actionLabel}</p>
              <h2 className="mt-2 text-lg font-semibold text-white">{remoteUser?.fullName || "Unknown user"}</h2>
              <p className="text-sm text-slate-400">{callTypeLabel}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900 px-3 text-xs font-semibold text-slate-300">
                {callStatus === "incoming" ? "Incoming" : callStatus === "outgoing" ? "Ringing" : "Live"}
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 p-3">
            {callType === "video" ? (
              <div className="relative h-[320px] overflow-hidden rounded-3xl bg-slate-950">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted={!speakerOn}
                  className={`h-full w-full object-cover ${activeVideoClass}`}
                />
                <audio ref={remoteAudioRef} autoPlay className="hidden" />
                {callStatus !== "inCall" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/70 text-center text-slate-200">
                    <Video size={32} />
                    <p className="text-sm font-semibold">{callMessage || "Waiting for response"}</p>
                  </div>
                )}
                <div className="absolute right-4 top-4 flex items-center gap-2">
                  <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 p-1 shadow-lg shadow-black/20">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="h-24 w-24 rounded-2xl object-cover"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[320px] flex-col items-center justify-center gap-4 rounded-3xl bg-slate-950/90 text-center text-slate-200">
                <audio ref={remoteAudioRef} autoPlay className="hidden" />
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-800 text-white">
                  <PhoneIncoming size={32} />
                </div>
                <p className="text-sm text-slate-400">Audio calling gives you a clean audio experience with low latency.</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-300">{callMessage || (callStatus === "inCall" ? "Live now" : "Awaiting answer")}</p>
              {callStatus === "inCall" && (
                <p className="mt-1 text-xs text-slate-500">Duration: {formatDuration(elapsed)}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleToggleSpeaker}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-slate-200 transition hover:bg-slate-800"
                title="Toggle speaker"
              >
                <Volume2 size={18} />
              </button>
              <button
                type="button"
                onClick={handleFullscreen}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-slate-200 transition hover:bg-slate-800"
                title="Fullscreen"
              >
                <Maximize2 size={18} />
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {callStatus === "incoming" ? (
              <>
                <button
                  type="button"
                  onClick={handleAccept}
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                >
                  Reject
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={toggleMic}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                >
                  {micMuted ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                {callType === "video" && (
                  <button
                    type="button"
                    onClick={toggleCamera}
                    className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                  >
                    {cameraOff ? <VideoOff size={18} /> : <Video size={18} />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleEnd}
                  className="inline-flex items-center justify-center rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-400"
                >
                  <PhoneOff size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CallOverlay;
