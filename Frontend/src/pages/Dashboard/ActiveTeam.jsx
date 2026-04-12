import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiUser, FiMessageSquare } from "react-icons/fi";
import InviteModal from "./InviteModal";

export default function ActiveTeam({ currentUserId }) {
  const [activeTeam, setActiveTeam] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!currentUserId) return;
    try {
      setLoading(true);
      const [activeRes, usersRes] = await Promise.all([
        axios.get(`/api/invite/team/active/${currentUserId}`),
        axios.get(`/api/auth/alluser`)
      ]);

      setActiveTeam(activeRes.data);
      setAllUsers(usersRes.data.filter(u => u._id !== currentUserId));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUserId]);

  const handleInvite = async (user) => {
    try {
      await axios.post(`/api/invite/invite`, {
        senderId: currentUserId,
        receiverId: user._id,
        role: "Developer"
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to send invite");
    }
  };

  if (loading) return <p className="text-white">Loading team...</p>;

  return (
    <>
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <h3 className="font-semibold mb-2 text-white">Active Team</h3>

        {activeTeam.map(user => (
          <div key={user._id} className="flex justify-between items-center bg-gray-700 p-2 rounded mb-2">
            <div className="flex items-center space-x-2">
              <img src={`https://i.pravatar.cc/30?u=${user._id}`} alt={user.fullName} className="w-8 h-8 rounded-full"/>
              <span className="text-white">{user.fullName}</span>
            </div>
            <FiMessageSquare className="text-gray-400 cursor-pointer hover:text-white transition"/>
          </div>
        ))}

        <button
          onClick={() => setShowModal(true)}
          className="mt-3 border border-gray-600 w-full py-1 rounded hover:bg-gray-700 transition flex items-center justify-center text-white"
        >
          <FiUser className="mr-1" /> Invite Member
        </button>
      </div>

      {showModal && (
        <InviteModal
          users={allUsers}
          onClose={() => setShowModal(false)}
          onInvite={handleInvite}
        />
      )}
    </>
  );
}

