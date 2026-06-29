import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
    Phone, Video, Search, Settings, ShieldCheck, ArrowRight, X, ChevronLeft,
    BellOff, Bell, Download, Trash2, UserX, AlertTriangle, Check, Loader2, Pin, PinOff
} from "lucide-react";

import useConversation from "../../../zustand/useConversation.js";
import { useSocketContext } from "../../../context/SocketContext.jsx";
import useCallStore from "../../../zustand/useCallStore.js";
import { getLocalMediaStream, getFriendlyMediaErrorMessage } from "../../../utils/webrtc.js";

function Chatuser({ showSettings, setShowSettings }) {
    const { selectedConversation, setSelectedConversation, messages, setMessage } = useConversation();
    const { onlineUsers, socket } = useSocketContext();
    const [loadingAction, setLoadingAction] = useState(null);
    const [confirmClear, setConfirmClear] = useState(false);

    const authUser = JSON.parse(localStorage.getItem("ChatApp"));
    const token = authUser?.token;
    const currentUserId = authUser?.user?._id;

    useEffect(() => {
        document.body.style.overflow = showSettings ? "hidden" : "auto";
        return () => { document.body.style.overflow = "auto"; };
    }, [showSettings]);

    if (!selectedConversation) return null;

    const otherUser = selectedConversation.members?.find(
        (member) => (member._id || member).toString() !== currentUserId.toString()
    );

    const otherUserId = otherUser?._id?.toString();
    const isOnline = otherUserId ? onlineUsers.some((id) => id?.toString() === otherUserId) : false;
    const canStartCall = socket?.connected && isOnline && Boolean(otherUserId);

    const initial = otherUser?.fullName ? otherUser.fullName.charAt(0).toUpperCase() : "?";

    // Safely get userSettings as it's a Map in MongoDB but could come as object in JSON
    const userSettingsMap = selectedConversation.userSettings || {};
    const mySettings = userSettingsMap[currentUserId] || { isPinned: false, isMuted: false, isBlocked: false };

    const handleUpdateSetting = async (key, value) => {
        if (!token || !selectedConversation._id) return;
        setLoadingAction(key);
        try {
            const res = await axios.put(
                `/api/conversation/${selectedConversation._id}/settings`,
                { [key]: value },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSelectedConversation(res.data);
        } catch (error) {
            console.error("Failed to update setting:", error);
        } finally {
            setLoadingAction(null);
        }
    };

    const handleClearHistory = async () => {
        if (!token || !selectedConversation._id) return;
        setLoadingAction("clear");
        try {
            const res = await axios.delete(
                `/api/conversation/${selectedConversation._id}/history`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSelectedConversation(res.data);
            setMessage([]); // Clear locally
            setConfirmClear(false);
            
            // Real-time clear history event
            if (socket) {
                socket.emit("clear-history", { conversationId: selectedConversation._id, userId: currentUserId });
            }
        } catch (error) {
            console.error("Failed to clear history:", error);
        } finally {
            setLoadingAction(null);
        }
    };

    const handleExportConversation = () => {
        const text = messages.map(m => {
            const sender = m.senderId === currentUserId ? "Me" : otherUser?.fullName;
            const time = new Date(m.createdAt).toLocaleString();
            return `[${time}] ${sender}: ${m.message}`;
        }).join("\n");
        
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Chat_Export_${otherUser?.fullName || "User"}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <>
            {/* HEADER */}
            <div className="relative flex items-center justify-between h-[60px] sm:h-[70px] px-3 sm:px-6 bg-surface border-b border-border-subtle shadow-sm select-none z-20">
                <button
                    className="lg:hidden p-2 mr-1 text-text-muted hover:text-text-primary hover:bg-hover-bg rounded-lg transition shrink-0"
                    onClick={() => setSelectedConversation(null)}
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-info flex items-center justify-center font-bold text-white overflow-hidden shadow-sm">
                            {otherUser?.avatar ? (
                                <img src={otherUser.avatar} alt={otherUser?.fullName || "User"} className="object-cover w-full h-full" />
                            ) : initial}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface ${isOnline ? "bg-success" : "bg-text-disabled"}`}>
                            {isOnline && <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />}
                        </span>
                    </div>

                    <div>
                        <h1 className="text-sm font-bold text-text-primary tracking-wide leading-tight flex items-center gap-2">
                            {otherUser?.fullName || "User"}
                            {mySettings.isMuted && <BellOff size={12} className="text-text-muted" />}
                        </h1>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-success animate-pulse" : "bg-text-disabled"}`} />
                            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                                {isOnline ? "Active Now" : "Offline"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* AV Actions */}
                    <button onClick={async () => { /* implementation */ }} disabled={!canStartCall} className={`h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-200 ${canStartCall ? "text-text-muted hover:bg-hover-bg hover:text-text-primary" : "cursor-not-allowed opacity-50"}`}>
                        <Phone size={16} />
                    </button>
                    <button onClick={async () => { /* implementation */ }} disabled={!canStartCall} className={`h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-200 ${canStartCall ? "text-text-muted hover:bg-hover-bg hover:text-text-primary" : "cursor-not-allowed opacity-50"}`}>
                        <Video size={16} />
                    </button>

                    <div className="h-4 w-[1px] bg-border-subtle mx-1" />

                    <button className="h-9 w-9 flex items-center justify-center rounded-lg text-text-muted hover:bg-hover-bg hover:text-text-primary transition-all duration-200">
                        <Search size={16} />
                    </button>
                    <button onClick={() => setShowSettings(true)} className="h-9 w-9 flex items-center justify-center rounded-lg text-text-muted hover:bg-hover-bg hover:text-text-primary transition-all duration-200">
                        <Settings size={16} />
                    </button>
                </div>
            </div>

            {/* FULLSCREEN SETTINGS DRAWER */}
            {typeof document !== 'undefined' && createPortal(
                <div className={`fixed inset-0 z-[999] flex justify-end transition-all duration-300 ${showSettings ? "visible" : "invisible pointer-events-none"}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                    <div className={`absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-300 ${showSettings ? "opacity-100" : "opacity-0"}`} onClick={() => setShowSettings(false)} />

                    <aside className={`relative z-50 flex h-full w-full max-w-sm flex-col bg-surface border-l border-border-subtle shadow-2xl transition-transform duration-300 ease-in-out ${showSettings ? "translate-x-0" : "translate-x-full"}`}>
                        {/* TOP BAR */}
                        <div className="sticky top-0 bg-surface/95 backdrop-blur px-5 py-4 z-10 border-b border-border-subtle flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-text-primary">Conversation Settings</h2>
                                <p className="text-[11px] font-medium text-text-muted mt-0.5">Manage preferences & privacy</p>
                            </div>
                            <button onClick={() => setShowSettings(false)} className="h-9 w-9 rounded-full bg-hover-bg flex items-center justify-center text-text-secondary hover:text-text-primary transition">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-5 space-y-6">
                            {/* PROFILE CARD */}
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-info flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-lg border-[4px] border-surface mb-4">
                                    {otherUser?.avatar ? <img src={otherUser.avatar} alt={otherUser.fullName} className="object-cover w-full h-full" /> : initial}
                                </div>
                                <h3 className="text-xl font-bold text-text-primary">{otherUser?.fullName}</h3>
                                <p className="text-sm text-text-muted mt-1">{otherUser?.email}</p>
                            </div>

                            <hr className="border-border-subtle" />

                            {/* PREFERENCES */}
                            <div className="space-y-4">
                                <h4 className="text-[11px] uppercase tracking-widest font-bold text-text-muted px-1">Preferences</h4>
                                
                                {/* Mute Toggle */}
                                <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border-subtle shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${mySettings.isMuted ? 'bg-error/10 text-error' : 'bg-surface text-text-secondary'}`}>
                                            {mySettings.isMuted ? <BellOff size={18} /> : <Bell size={18} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-text-primary">Mute Notifications</p>
                                            <p className="text-[11px] text-text-muted">Silence alerts for this chat</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleUpdateSetting('isMuted', !mySettings.isMuted)}
                                        disabled={loadingAction === 'isMuted'}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface ${mySettings.isMuted ? 'bg-error' : 'bg-border-strong'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${mySettings.isMuted ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                {/* Pin Toggle */}
                                <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border-subtle shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${mySettings.isPinned ? 'bg-primary/10 text-primary' : 'bg-surface text-text-secondary'}`}>
                                            {mySettings.isPinned ? <Pin size={18} /> : <PinOff size={18} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-text-primary">Pin Conversation</p>
                                            <p className="text-[11px] text-text-muted">Keep this chat at the top</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleUpdateSetting('isPinned', !mySettings.isPinned)}
                                        disabled={loadingAction === 'isPinned'}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface ${mySettings.isPinned ? 'bg-primary' : 'bg-border-strong'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${mySettings.isPinned ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* PRIVACY & ACTIONS */}
                            <div className="space-y-3">
                                <h4 className="text-[11px] uppercase tracking-widest font-bold text-text-muted px-1 mt-2">Privacy & Actions</h4>

                                <button onClick={handleExportConversation} className="w-full flex items-center gap-3 bg-card p-4 rounded-2xl border border-border-subtle shadow-sm hover:border-primary/30 transition group">
                                    <div className="p-2 rounded-xl bg-surface text-text-secondary group-hover:bg-primary/10 group-hover:text-primary transition">
                                        <Download size={18} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition">Export Chat History</p>
                                        <p className="text-[11px] text-text-muted">Download as .txt file</p>
                                    </div>
                                    <ArrowRight size={16} className="text-text-muted group-hover:text-primary transition" />
                                </button>

                                <button 
                                    onClick={() => handleUpdateSetting('isBlocked', !mySettings.isBlocked)}
                                    disabled={loadingAction === 'isBlocked'}
                                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border shadow-sm transition group ${mySettings.isBlocked ? 'bg-rose-500 text-white border-rose-600' : 'bg-card border-border-subtle hover:border-rose-300'}`}
                                >
                                    <div className={`p-2 rounded-xl transition ${mySettings.isBlocked ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-500 group-hover:bg-rose-100'}`}>
                                        {loadingAction === 'isBlocked' ? <Loader2 size={18} className="animate-spin" /> : <UserX size={18} />}
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className={`text-sm font-semibold ${mySettings.isBlocked ? 'text-white' : 'text-rose-600'}`}>{mySettings.isBlocked ? 'Unblock User' : 'Block User'}</p>
                                        <p className={`text-[11px] ${mySettings.isBlocked ? 'text-rose-100' : 'text-text-muted'}`}>{mySettings.isBlocked ? 'Allow messages again' : 'Prevent them from messaging you'}</p>
                                    </div>
                                </button>

                                {/* Clear History Section */}
                                {confirmClear ? (
                                    <div className="w-full bg-error/10 p-4 rounded-2xl border border-error/20 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-start gap-3 mb-3">
                                            <AlertTriangle size={18} className="text-error mt-0.5" />
                                            <div>
                                                <p className="text-sm font-bold text-error">Are you absolutely sure?</p>
                                                <p className="text-[11px] text-error/80 mt-1">This will permanently delete all messages for both of you. This cannot be undone.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setConfirmClear(false)}
                                                className="flex-1 py-2 rounded-xl text-xs font-semibold text-text-primary bg-surface border border-border-subtle hover:bg-hover-bg transition"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleClearHistory}
                                                disabled={loadingAction === 'clear'}
                                                className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-error hover:bg-error/90 transition flex items-center justify-center gap-2 shadow-sm"
                                            >
                                                {loadingAction === 'clear' ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                Delete All
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setConfirmClear(true)}
                                        className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-transparent hover:bg-error/5 hover:text-error text-text-secondary transition text-sm font-semibold mt-2"
                                    >
                                        <Trash2 size={16} /> Clear Conversation History
                                    </button>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>,
                document.body
            )}
        </>
    );
}

export default Chatuser;