import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { MessageSquare, Search, UserPlus, UsersRound } from "lucide-react";
import InviteModal from "./InviteModal";
import { useNavigate } from "react-router-dom";
import useConversation from "../../zustand/useConversation.js";

export default function ActiveTeam({ currentUserId }) {
  const navigate = useNavigate();
  const { setSelectedConversation, setSelectedWorkspace } = useConversation();
  const [activeTeam, setActiveTeam] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const authUser = JSON.parse(localStorage.getItem("ChatApp") || "{}");
  const token = authUser?.token;

  const fetchData = async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [activeRes, usersRes] = await Promise.all([
        axios.get(`/api/invite/team/active/${currentUserId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/auth/alluser", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const activeMembers = activeRes.data || [];
      const uniqueActiveMembers = Array.from(new Map(activeMembers.map(user => [user._id, user])).values());
      setActiveTeam(uniqueActiveMembers);

      const activeMemberIds = activeMembers.map((member) => member._id);
      setAllUsers(
        (usersRes.data || []).filter(
          (user) =>
            user._id !== currentUserId &&
            !activeMemberIds.includes(user._id) &&
            !user.fullName?.toLowerCase().includes("bot") &&
            !user.fullName?.toLowerCase().includes("ai") &&
            !user.email?.toLowerCase().includes("bot")
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUserId]);

  const filteredTeam = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return activeTeam;

    return activeTeam.filter((user) => {
      const name = user.fullName || "";
      const email = user.email || "";
      return `${name} ${email}`.toLowerCase().includes(search);
    });
  }, [activeTeam, query]);

  const handleMessage = async (user) => {
    if (!user?._id) return;
    try {
      const res = await axios.get(`/api/conversation/get-or-create/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const conversation = res.data;
      setSelectedWorkspace(null);
      setSelectedConversation(conversation);
      navigate("/chat");
    } catch (err) {
      console.error("Error getting/creating conversation:", err);
    }
  };

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
      <section className="overflow-hidden rounded-2xl border border-border-subtle bg-card shadow-sm">
        <div className="border-b border-border-subtle bg-gradient-to-br from-primary/10 via-transparent to-info/10 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary-soft text-primary">
                <UsersRound size={19} />
              </div>
              <h3 className="text-base font-semibold text-text-primary">Active Team</h3>
              <p className="mt-1 text-xs leading-5 text-text-muted">Collaborators with active access to your projects.</p>
            </div>
            <span className="rounded-full border border-border-subtle bg-surface/70 px-2.5 py-1 text-xs font-semibold text-text-secondary backdrop-blur">
              {activeTeam.length} members
            </span>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            <UserPlus size={16} />
            Invite member
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search teammates..."
              className="h-10 w-full rounded-xl border border-border-subtle bg-input-bg pl-9 pr-3 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="space-y-2">
            {loading && <TeamSkeleton />}

            {!loading && activeTeam.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border-default bg-muted/40 px-4 py-8 text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <UserPlus size={19} />
                </div>
                <p className="text-sm font-semibold text-text-primary">No active members yet</p>
                <p className="mt-1 text-xs text-text-muted">Invite teammates to start collaborating.</p>
              </div>
            )}

            {!loading && activeTeam.length > 0 && filteredTeam.length === 0 && (
              <div className="rounded-xl bg-muted px-3 py-5 text-center text-sm text-text-secondary">
                No teammates match your search.
              </div>
            )}

            {!loading && filteredTeam.map((user) => (
              <div
                key={user._id}
                className="group flex items-center justify-between rounded-xl border border-transparent px-2 py-2 transition hover:border-border-subtle hover:bg-hover-bg"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold bg-primary-soft text-primary ring-1 ring-border-subtle shrink-0 overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover animate-in fade-in duration-300" />
                      ) : (
                        user.fullName?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">{user.fullName || "Team member"}</p>
                    <p className="truncate text-xs text-text-muted">{user.email || "Online now"}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleMessage(user)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-text-muted transition hover:bg-surface hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                  aria-label={`Message ${user.fullName || "team member"}`}
                >
                  <MessageSquare size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showModal && <InviteModal users={allUsers} onClose={() => setShowModal(false)} onInvite={handleInvite} />}
    </>
  );
}

function TeamSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((item) => (
        <div key={item} className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
