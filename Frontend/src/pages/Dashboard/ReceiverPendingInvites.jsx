import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function ReceiverPendingInvites({
  currentUserId,
  onClose,
}) {
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const res = await axios.get(
        `/api/invite/team/pending/${currentUserId}`
      );
      setPendingInvites(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAccept = async (inviteId) => {
    try {
      await axios.post("/api/invite/invite/accept", { inviteId });

      toast.success("Invitation Accepted 🎉");

      // 🔄 Remove from UI instantly (No full reload)
      setPendingInvites((prev) =>
        prev.filter((invite) => invite._id !== inviteId)
      );

    } catch (err) {
      toast.error("Failed to accept invite");
    }
  };

  const handleDecline = async (inviteId) => {
    try {
      await axios.post("/api/invite/invite/cancel", { inviteId });

      toast("Invitation Declined ❌");

      setPendingInvites((prev) =>
        prev.filter((invite) => invite._id !== inviteId)
      );

    } catch (err) {
      toast.error("Failed to decline invite");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#1F2937] w-[500px] max-h-[80vh] rounded-2xl shadow-2xl p-6 relative border border-gray-700"
        >

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <FiX size={18} />

          </button>

          <h2 className="text-lg font-semibold mb-4 text-white">
            Pending Invitations
          </h2>

          <div className="space-y-3 max-h-64 overflow-y-auto">

            {loading && (
              <p className="text-gray-400 text-sm">Loading...</p>
            )}

            {!loading && pendingInvites.length === 0 && (
              <p className="text-gray-400 text-sm">
                No pending invites 🎉
              </p>
            )}

            {pendingInvites.map((invite) => (
              <motion.div
                key={invite._id}
                layout
                className="flex items-center justify-between p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
              >
                <div>
                  <p className="text-white text-sm font-medium">
                    {invite.sender?.fullName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {invite.sender?.email}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(invite._id)}
                    className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-white text-xs"
                  >
                    Accept
                  </button>

                  <button
                    onClick={() => handleDecline(invite._id)}
                    className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-white text-xs"
                  >
                    Decline
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
