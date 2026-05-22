import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import axios from "axios";
import ReceiverPendingInvites from "../pages/Dashboard/ReceiverPendingInvites";

const Notification = ({ currentUserId }) => {
    const [showInvites, setShowInvites] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    // Fetch pending invites count
    const fetchPendingCount = async () => {
        try {
            const res = await axios.get(`/api/invite/team/pending/${currentUserId}`);
            setPendingCount(res.data.length);
        } catch (err) {
            console.error("Failed to fetch pending invites", err);
        }
    };

    useEffect(() => {
        if (currentUserId) {
            fetchPendingCount();
        }
    }, [currentUserId]);

    // Update count after accept/decline
    const handleUpdateCount = (newCount) => {
        setPendingCount(newCount);
    };

    return (
        <div className="relative">
            <button
                type="button"
                className="icon-button"
                onClick={() => setShowInvites(!showInvites)}
                aria-label="View notifications"
            >
                <Bell size={17} />
            </button>

            {/* Count Badge */}
            {pendingCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
                    {pendingCount}
                </span>
            )}

            {/* Dropdown */}
            {showInvites && (
                <div className="absolute top-10 right-0 z-50">
                    <ReceiverPendingInvites
                        currentUserId={currentUserId}
                        onClose={() => setShowInvites(false)}
                        onUpdateCount={handleUpdateCount}
                    />
                </div>
            )}
        </div>
    );
};

export default Notification;
