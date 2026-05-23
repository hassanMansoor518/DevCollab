import React, { useState, useEffect } from "react";
import { FiBell } from "react-icons/fi";
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
        <div className="relative cursor-pointer">
            {/* Bell Icon */}
            <FiBell
                className="text-gray-400 hover:text-white transition"
                size={24}
                onClick={() => setShowInvites(!showInvites)}
            />

            {/* Count Badge */}
            {pendingCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
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