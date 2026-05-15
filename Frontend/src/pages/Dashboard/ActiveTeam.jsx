import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiMessageSquare, FiUserPlus } from "react-icons/fi";
import InviteModal from "./InviteModal";

export default function ActiveTeam({ currentUserId }) {
  const [activeTeam, setActiveTeam] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const authUser = JSON.parse(localStorage.getItem("ChatApp"));
  const token = authUser?.token;

  const fetchData = async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);

      const [activeRes, usersRes] = await Promise.all([
        axios.get(`/api/invite/team/active/${currentUserId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/api/auth/alluser`, { headers: { Authorization: `Bearer ${token}` } }),
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
        role: "Developer",
      }, { headers: { Authorization: `Bearer ${token}` } });

      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="
        bg-[#111827]/70
        border border-white/[0.05]
        rounded-2xl
        p-4
      ">

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">
            Team
          </h3>

          <span className="text-xs text-gray-500">
            {activeTeam.length} members
          </span>
        </div>

        {/* TEAM LIST */}
        <div className="space-y-2">

          {loading && (
            <p className="text-xs text-gray-500">
              Loading...
            </p>
          )}

          {activeTeam.map((user) => (
            <div
              key={user._id}
              className="
                flex items-center justify-between
                p-2 rounded-xl
                hover:bg-white/[0.03]
                transition
              "
            >

              <div className="flex items-center gap-3">

                <img
                  src={`https://i.pravatar.cc/40?u=${user._id}`}
                  className="w-8 h-8 rounded-full"
                />

                <div>
                  <p className="text-sm text-white leading-tight">
                    {user.fullName}
                  </p>

                  <p className="text-xs text-gray-500">
                    Online
                  </p>
                </div>

              </div>

              <FiMessageSquare className="text-gray-500 hover:text-white cursor-pointer transition" />

            </div>
          ))}

        </div>

        {/* INVITE BUTTON */}
        <button
          onClick={() => setShowModal(true)}
          className="
            mt-3 w-full
            flex items-center justify-center gap-2
            py-2
            text-xs
            text-gray-300
            bg-white/[0.03]
            hover:bg-white/[0.06]
            border border-white/[0.05]
            rounded-xl
            transition
          "
        >
          <FiUserPlus />
          Invite member
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