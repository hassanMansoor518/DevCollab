import React, { useEffect, useState } from "react";
import axios from "axios";
import { MessageSquare, UserPlus } from "lucide-react";
import InviteModal from "./InviteModal";

export default function ActiveTeam({ currentUserId }) {
  const [activeTeam, setActiveTeam] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const authUser = JSON.parse(localStorage.getItem("ChatApp") || "{}");
  const token = authUser?.token;

  const fetchData = async () => {
    if (!currentUserId) return;
    try {
      setLoading(true);
      const [activeRes, usersRes] = await Promise.all([
        axios.get(`/api/invite/team/active/${currentUserId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/auth/alluser", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setActiveTeam(activeRes.data || []);
      setAllUsers((usersRes.data || []).filter((user) => user._id !== currentUserId));
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
      await axios.post(
        "/api/invite/invite",
        { senderId: currentUserId, receiverId: user._id, role: "Developer" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <section className="panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-text-primary">Team</h3>
            <p className="text-xs text-text-muted">Collaborators with active access</p>
          </div>
          <span className="text-xs font-medium text-text-muted">{activeTeam.length} members</span>
        </div>

        <div className="space-y-2">
          {loading && <div className="skeleton-line h-10 rounded-lg" />}
          {!loading && activeTeam.length === 0 && (
            <p className="rounded-lg bg-muted px-3 py-4 text-center text-sm text-text-secondary">No active members yet.</p>
          )}
          {activeTeam.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between rounded-lg px-2 py-2 transition hover:bg-hover-bg"
            >
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={`https://i.pravatar.cc/40?u=${user._id}`}
                  alt=""
                  className="h-9 w-9 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">{user.fullName}</p>
                  <p className="text-xs text-success">Online</p>
                </div>
              </div>
              <button className="icon-button h-8 w-8" aria-label={`Message ${user.fullName}`}>
                <MessageSquare size={15} />
              </button>
            </div>
          ))}
        </div>

        <button onClick={() => setShowModal(true)} className="btn-secondary mt-4 w-full">
          <UserPlus size={16} />
          Invite member
        </button>
      </section>

      {showModal && <InviteModal users={allUsers} onClose={() => setShowModal(false)} onInvite={handleInvite} />}
    </>
  );
}
