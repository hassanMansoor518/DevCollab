import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { UserPlus, X } from "lucide-react";
import ReceiverPendingInvites from "../pages/Dashboard/ReceiverPendingInvites";

const formatCount = (count) => (count > 99 ? "99+" : count);

const Notification = ({ currentUserId }) => {
    const [showInvites, setShowInvites] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [loadingCount, setLoadingCount] = useState(false);
    const dropdownRef = useRef(null);

    const fetchPendingCount = async () => {
        if (!currentUserId) return;

        try {
            setLoadingCount(true);
            const res = await axios.get(`/api/invite/team/pending/${currentUserId}`);
            setPendingCount(Array.isArray(res.data) ? res.data.length : 0);
        } catch (err) {
            console.error("Failed to fetch pending invites", err);
        } finally {
            setLoadingCount(false);
        }
    };

    useEffect(() => {
        fetchPendingCount();
    }, [currentUserId]);

    useEffect(() => {
        if (!showInvites) return undefined;

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowInvites(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") setShowInvites(false);
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [showInvites]);

    const handleUpdateCount = (newCount) => {
        setPendingCount(Math.max(0, newCount));
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setShowInvites((value) => !value)}
                aria-label={`Team invitations${pendingCount ? `, ${pendingCount} pending` : ""}`}
                aria-haspopup="dialog"
                aria-expanded={showInvites}
                className="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-surface/75 text-text-secondary shadow-sm backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-hover-bg hover:text-text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 sm:h-11 sm:w-11"
            >
                <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent opacity-0 transition group-hover:opacity-100" />
                <UserPlus size={18} className="relative z-10" />

                {loadingCount && (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full bg-primary" />
                )}

                {pendingCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 z-20 inline-flex min-w-[1.35rem] items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 via-primary to-cyan-400 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-lg shadow-primary/25 ring-2 ring-background before:absolute before:inset-0 before:-z-10 before:animate-ping before:rounded-full before:bg-primary/40">
                        {formatCount(pendingCount)}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {showInvites && (
                    <>
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm md:hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowInvites(false)}
                        />

                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            aria-label="Team invitations"
                            className="fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-hidden rounded-t-3xl border border-border-subtle bg-surface/95 shadow-[0_-24px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl md:absolute md:bottom-auto md:inset-x-auto md:right-0 md:top-14 md:w-[420px] md:rounded-2xl md:shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
                            initial={{ opacity: 0, y: 28, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 18, scale: 0.98 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                        >
                            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border-strong md:hidden" />
                            <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-4 py-4 sm:px-5">
                                <div>
                                    <p className="text-sm font-semibold text-text-primary">Team Invitations</p>
                                    <p className="mt-1 text-xs text-text-muted">
                                        {pendingCount === 1 ? "1 pending request" : `${pendingCount} pending requests`}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowInvites(false)}
                                    aria-label="Close invitations"
                                    className="rounded-lg p-2 text-text-muted transition hover:bg-hover-bg hover:text-text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <ReceiverPendingInvites
                                currentUserId={currentUserId}
                                onClose={() => setShowInvites(false)}
                                onUpdateCount={handleUpdateCount}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Notification;
