import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Check, Clock3, Inbox, Loader2, UserPlus, Users, X } from "lucide-react";

export default function ReceiverPendingInvites({
    currentUserId,
    onUpdateCount,
}) {
    const [pendingInvites, setPendingInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeInviteId, setActiveInviteId] = useState(null);

    const fetchPending = async () => {
        if (!currentUserId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await axios.get(`/api/invite/team/pending/${currentUserId}`);
            const invites = Array.isArray(res.data) ? res.data : [];
            setPendingInvites(invites);
            onUpdateCount?.(invites.length);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load invitations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, [currentUserId]);

    const removeInvite = (inviteId) => {
        setPendingInvites((prev) => {
            const next = prev.filter((invite) => invite._id !== inviteId);
            onUpdateCount?.(next.length);
            return next;
        });
    };

    const handleAccept = async (inviteId) => {
        try {
            setActiveInviteId(inviteId);
            await axios.post("/api/invite/invite/accept", { inviteId });
            toast.success("Invitation accepted");
            removeInvite(inviteId);
        } catch (err) {
            toast.error("Failed to accept invite");
        } finally {
            setActiveInviteId(null);
        }
    };

    const handleDecline = async (inviteId) => {
        try {
            setActiveInviteId(inviteId);
            await axios.post("/api/invite/invite/cancel", { inviteId });
            toast("Invitation declined");
            removeInvite(inviteId);
        } catch (err) {
            toast.error("Failed to decline invite");
        } finally {
            setActiveInviteId(null);
        }
    };

    return (
        <div className="max-h-[calc(88dvh-88px)] overflow-y-auto px-3 py-3 sm:px-4">
            {loading && <InviteSkeletonList />}

            {!loading && pendingInvites.length === 0 && <EmptyInvites />}

            {!loading && pendingInvites.length > 0 && (
                <div className="space-y-2.5 pb-2">
                    {pendingInvites.map((invite, index) => {
                        const senderName = invite.sender?.fullName || "Team member";
                        const senderEmail = invite.sender?.email || "Invited you to collaborate";
                        const isBusy = activeInviteId === invite._id;

                        return (
                            <motion.article
                                key={invite._id}
                                layout
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ delay: index * 0.03, duration: 0.18 }}
                                className="group rounded-2xl border border-border-subtle bg-card/80 p-3 shadow-sm transition hover:border-primary/25 hover:bg-hover-bg"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary-soft text-primary">
                                        <Users size={18} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-text-primary">
                                                    {senderName}
                                                </p>
                                                <p className="mt-0.5 truncate text-xs text-text-muted">
                                                    {senderEmail}
                                                </p>
                                            </div>

                                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border-subtle bg-muted px-2 py-1 text-[10px] font-semibold text-text-muted">
                                                <Clock3 size={11} />
                                                Pending
                                            </span>
                                        </div>

                                        <p className="mt-2 text-xs leading-5 text-text-secondary">
                                            Wants to add you to their development team.
                                        </p>

                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleDecline(invite._id)}
                                                disabled={isBusy}
                                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-surface px-3 text-xs font-semibold text-text-secondary transition hover:bg-error-soft hover:text-error disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                                            >
                                                {isBusy ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                                                Decline
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleAccept(invite._id)}
                                                disabled={isBusy}
                                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-white shadow-sm shadow-primary/20 transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                                            >
                                                {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                                Accept
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function InviteSkeletonList() {
    return (
        <div className="space-y-2.5" aria-label="Loading invitations">
            {[0, 1, 2].map((item) => (
                <div key={item} className="rounded-2xl border border-border-subtle bg-card/70 p-3">
                    <div className="flex gap-3">
                        <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
                        <div className="min-w-0 flex-1 space-y-2">
                            <div className="h-3 w-2/3 rounded-full bg-muted animate-pulse" />
                            <div className="h-3 w-1/2 rounded-full bg-muted animate-pulse" />
                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <div className="h-9 rounded-xl bg-muted animate-pulse" />
                                <div className="h-9 rounded-xl bg-muted animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyInvites() {
    return (
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-border-default bg-muted/40 px-6 py-10 text-center">
            <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary-soft text-primary shadow-sm">
                <Inbox size={24} />
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-border-subtle bg-surface text-primary">
                    <UserPlus size={13} />
                </span>
            </div>
            <h3 className="text-sm font-semibold text-text-primary">No Pending Invitations</h3>
            <p className="mt-1 max-w-[240px] text-xs leading-5 text-text-muted">
                New team invitations will appear here when someone invites you to collaborate.
            </p>
        </div>
    );
}
