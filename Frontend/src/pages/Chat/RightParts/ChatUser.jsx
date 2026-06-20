import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    Phone,
    Video,
    Search,
    Settings,
    LayoutGrid,
    ShieldCheck,
    ArrowRight,
    X,
    ChevronLeft,
} from "lucide-react";

import useConversation from "../../../zustand/useConversation.js";
import { useSocketContext } from "../../../context/SocketContext.jsx";
import useCallStore from "../../../zustand/useCallStore.js";
import { getLocalMediaStream, getFriendlyMediaErrorMessage } from "../../../utils/webrtc.js";

import profile from "../../../assets/Profile.png";

function Chatuser({
    showSettings,
    setShowSettings,
}) {
    const { selectedConversation, setSelectedConversation } =
        useConversation();

    const { onlineUsers, socket } =
        useSocketContext();

    const authUser = JSON.parse(
        localStorage.getItem("ChatApp")
    );

    const socketReady = Boolean(
        socket?.connected
    );

    // FIX:
    // body scroll disable when sidebar open
    useEffect(() => {
        if (showSettings) {
            document.body.style.overflow =
                "hidden";
        } else {
            document.body.style.overflow =
                "auto";
        }

        return () => {
            document.body.style.overflow =
                "auto";
        };
    }, [showSettings]);

    if (!selectedConversation) return null;

    const otherUser =
        selectedConversation.members?.find(
            (member) =>
                (
                    member._id || member
                ).toString() !==
                authUser.user._id.toString()
        );

    const otherUserId =
        otherUser?._id?.toString();

    const isOnline = otherUserId
        ? onlineUsers.some(
            (id) =>
                id?.toString() ===
                otherUserId
        )
        : false;

    const canStartCall =
        socketReady &&
        isOnline &&
        Boolean(otherUserId);

    const initial = otherUser?.fullName
        ? otherUser.fullName
            .charAt(0)
            .toUpperCase()
        : "?";

    return (
        <>
            {/* HEADER */}
            <div className="relative flex items-center justify-between h-[60px] sm:h-[70px] px-3 sm:px-6 bg-surface border-b border-border-subtle shadow-sm select-none z-20">
                {/* MOBILE BACK BUTTON */}
                <button
                    className="lg:hidden p-2 mr-1 text-text-muted hover:text-text-primary hover:bg-hover-bg rounded-lg transition shrink-0"
                    onClick={() => setSelectedConversation(null)}
                    aria-label="Back to contacts"
                >
                    <ChevronLeft size={20} />
                </button>

                {/* USER INFO */}
                <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-info flex items-center justify-center font-bold text-white overflow-hidden shadow-sm">
                            {profile ? (
                                <img
                                    src={profile}
                                    alt={
                                        otherUser?.fullName ||
                                        "User"
                                    }
                                    className="object-cover w-full h-full"
                                    onError={(
                                        e
                                    ) => {
                                        e.target.style.display =
                                            "none";

                                        e.target.parentNode.textContent =
                                            initial;
                                    }}
                                />
                            ) : (
                                initial
                            )}
                        </div>

                        {/* ONLINE */}
                        <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface ${isOnline
                                ? "bg-success"
                                : "bg-text-disabled"
                                }`}
                        >
                            {isOnline && (
                                <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
                            )}
                        </span>
                    </div>

                    <div>
                        <h1 className="text-sm font-bold text-text-primary tracking-wide leading-tight">
                            {otherUser?.fullName ||
                                "User"}
                        </h1>

                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                                className={`w-1.5 h-1.5 rounded-full ${isOnline
                                    ? "bg-success animate-pulse"
                                    : "bg-text-disabled"
                                    }`}
                            />

                            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                                {isOnline
                                    ? "Active Now"
                                    : "Offline"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-1.5">
                    {/* AUDIO */}
                    <button
                        onClick={async () => {
                            if (!canStartCall || !otherUser?._id) return;
                            const caller = JSON.parse(localStorage.getItem("ChatApp"))?.user;
                            if (!caller) return;

                            try {
                                const stream = await getLocalMediaStream("audio");
                                useCallStore.getState().setLocalStream(stream);

                                const callId = `${caller._id}-${otherUser._id}-${Date.now()}`;
                                useCallStore.getState().startOutgoingCall({
                                    callId,
                                    callType: "audio",
                                    remoteUser: otherUser,
                                    conversationId: selectedConversation?._id,
                                });

                                socket.emit("call-user", {
                                    to: otherUser._id,
                                    callType: "audio",
                                    callId,
                                    conversationId: selectedConversation?._id,
                                    caller: { _id: caller._id, fullName: caller.fullName },
                                });
                            } catch (err) {
                                console.error("Camera/Mic permission denied", err);
                                alert(getFriendlyMediaErrorMessage(err));
                            }
                        }}
                        disabled={!canStartCall}
                        className={`h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-200 ${canStartCall
                            ? "text-text-muted hover:bg-hover-bg hover:text-text-primary"
                            : "cursor-not-allowed opacity-50"
                            }`}
                    >
                        <Phone size={16} />
                    </button>

                    {/* VIDEO */}
                    <button
                        onClick={async () => {
                            if (!canStartCall || !otherUser?._id) return;
                            const caller = JSON.parse(localStorage.getItem("ChatApp"))?.user;
                            if (!caller) return;

                            try {
                                const stream = await getLocalMediaStream("video");
                                useCallStore.getState().setLocalStream(stream);

                                const callId = `${caller._id}-${otherUser._id}-${Date.now()}`;
                                useCallStore.getState().startOutgoingCall({
                                    callId,
                                    callType: "video",
                                    remoteUser: otherUser,
                                    conversationId: selectedConversation?._id,
                                });

                                socket.emit("call-user", {
                                    to: otherUser._id,
                                    callType: "video",
                                    callId,
                                    conversationId: selectedConversation?._id,
                                    caller: { _id: caller._id, fullName: caller.fullName },
                                });
                            } catch (err) {
                                console.error("Camera/Mic permission denied", err);
                                alert(getFriendlyMediaErrorMessage(err));
                            }
                        }}
                        disabled={!canStartCall}
                        className={`h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-200 ${canStartCall
                            ? "text-text-muted hover:bg-hover-bg hover:text-text-primary"
                            : "cursor-not-allowed opacity-50"
                            }`}
                    >
                        <Video size={16} />
                    </button>

                    <div className="h-4 w-[1px] bg-border-subtle mx-1" />

                    {/* SEARCH */}
                    <button className="h-9 w-9 flex items-center justify-center rounded-lg text-text-muted hover:bg-hover-bg hover:text-text-primary transition-all duration-200">
                        <Search size={16} />
                    </button>

                    {/* SETTINGS */}
                    <button
                        onClick={() =>
                            setShowSettings(
                                true
                            )
                        }
                        className="h-9 w-9 flex items-center justify-center rounded-lg text-text-muted hover:bg-hover-bg hover:text-text-primary transition-all duration-200"
                    >
                        <Settings size={16} />
                    </button>
                </div>
            </div>

            {/* FULLSCREEN PORTAL FOR DRAWER AND OVERLAY */}
            {typeof document !== 'undefined' && createPortal(
                <div
                    className={`fixed inset-0 z-[999] flex justify-end transition-all duration-300 ${showSettings ? "visible" : "invisible pointer-events-none"}`}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                >
                    {/* OVERLAY */}
                    <div
                        className={`absolute inset-0 transition-opacity duration-300 ${showSettings ? "bg-black/45 backdrop-blur-[8px] opacity-100" : "opacity-0"}`}
                        onClick={() => setShowSettings(false)}
                    />

                    {/* SIDEBAR */}
                    <aside
                        className={`relative z-50 flex h-full w-full max-w-[420px] flex-col bg-surface border-l border-border-subtle shadow-[var(--shadow-popover)] transition-transform duration-300 ease-in-out overflow-hidden ${showSettings ? "translate-x-0" : "translate-x-full"}`}
                    >
                        {/* TOP */}
                        <div className="sticky top-0 bg-surface border-b border-border-subtle px-5 py-4 z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.3em] text-text-secondary">
                                        Conversation
                                        Settings
                                    </p>

                                    <h2 className="text-lg font-semibold text-text-primary mt-1">
                                        {
                                            otherUser?.fullName
                                        }
                                    </h2>
                                </div>

                                <button
                                    onClick={() =>
                                        setShowSettings(
                                            false
                                        )
                                    }
                                    className="h-10 w-10 rounded-2xl border border-border-subtle flex items-center justify-center hover:bg-hover-bg transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* BODY */}
                        <div className="overflow-y-auto h-[calc(100vh-80px)] p-5 space-y-4">
                            {/* PROFILE */}
                            <div className="rounded-3xl border border-border-subtle bg-card p-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-primary to-info flex items-center justify-center text-white text-xl font-bold">
                                        {initial}
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold text-text-primary truncate">
                                            {
                                                otherUser?.fullName
                                            }
                                        </h3>

                                        <p className="text-xs text-text-muted truncate mt-1">
                                            {
                                                otherUser?.email
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* NOTIFICATIONS */}
                        <div className="rounded-3xl border border-border-subtle bg-card p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-text-primary">
                                        Notifications
                                    </h3>

                                    <p className="text-xs text-text-muted mt-1">
                                        Silence alerts
                                        for this
                                        conversation.
                                    </p>
                                </div>

                                <button className="px-3 py-2 rounded-2xl border border-border-subtle text-sm font-semibold hover:bg-hover-bg transition">
                                    Active
                                </button>
                            </div>
                        </div>

                        {/* RULES */}
                        <div className="rounded-3xl border border-border-subtle bg-card p-4 shadow-sm space-y-3">
                            <div>
                                <h3 className="text-sm font-semibold text-text-primary">
                                    Conversation
                                    Rules
                                </h3>

                                <p className="text-xs text-text-muted mt-1">
                                    Tools for
                                    faster
                                    collaboration.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button className="rounded-2xl border border-border-subtle bg-surface px-3 py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-hover-bg transition">
                                    <LayoutGrid
                                        size={16}
                                    />
                                    Pin Chat
                                </button>

                                <button className="rounded-2xl border border-border-subtle bg-surface px-3 py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-hover-bg transition">
                                    <ShieldCheck
                                        size={16}
                                    />
                                    Important
                                </button>
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="rounded-3xl border border-border-subtle bg-card p-4 shadow-sm space-y-3">
                            <h3 className="text-sm font-semibold text-text-primary">
                                Actions
                            </h3>

                            <button className="w-full flex items-center justify-between rounded-2xl border border-border-subtle bg-surface px-4 py-3 text-sm font-semibold hover:bg-hover-bg transition">
                                <span>
                                    View Profile
                                </span>

                                <ArrowRight
                                    size={16}
                                />
                            </button>

                            <button className="w-full flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition">
                                <span>
                                    Block User
                                </span>

                                <ArrowRight
                                    size={16}
                                />
                            </button>
                        </div>
                    </aside>
                </div>,
                document.body
            )}
        </>
    );
}

export default Chatuser;