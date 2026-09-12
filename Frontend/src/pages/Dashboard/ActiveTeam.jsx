import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { MessageSquare, Search, UserPlus, UsersRound, Sparkles, Mail } from "lucide-react";
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
        axios.get(`/api/invite/team/active/${currentUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/auth/alluser", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const activeMembers = activeRes.data || [];
      const uniqueActiveMembers = Array.from(
        new Map(activeMembers.map((user) => [user._id, user])).values()
      );
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
        headers: { Authorization: `Bearer ${token}` },
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
      <section className="overflow-hidden rounded-3xl border border-[#1E293B] bg-[#0E1626]/90 shadow-md backdrop-blur-md">
        {/* Header with gradient & quick invite */}
        <div className="border-b border-[#1E293B] bg-gradient-to-br from-indigo-950/40 via-[#10192A] to-[#0E1626] p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 shadow-sm">
                <UsersRound size={19} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Active Teammates</h3>
                <p className="text-[11px] text-[#8B949E]">
                  Collaborating in your workspace
                </p>
              </div>
            </div>
            <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">
              {activeTeam.length} members
            </span>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:shadow-indigo-600/30"
          >
            <UserPlus size={14} />
            <span>Invite Collaborator</span>
          </button>
        </div>

        <div className="p-4">
          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8B949E]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search teammates..."
              className="h-8 w-full rounded-xl border border-[#30363D] bg-[#161B22] pl-8 pr-3 text-xs text-[#E6EDF3] placeholder-[#8B949E] outline-none transition focus:border-indigo-500"
            />
          </div>

          {/* Teammates List */}
          <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
            {loading && <TeamSkeleton />}

            {!loading && activeTeam.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#30363D] bg-[#111827]/30 px-4 py-8 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <UserPlus size={18} />
                </div>
                <p className="text-xs font-semibold text-white">No active teammates yet</p>
                <p className="mt-0.5 text-[11px] text-[#8B949E]">
                  Invite teammates to collaborate in real-time.
                </p>
              </div>
            )}

            {!loading && activeTeam.length > 0 && filteredTeam.length === 0 && (
              <div className="rounded-xl bg-[#161F30] px-3 py-4 text-center text-xs text-[#8B949E]">
                No teammates match your search.
              </div>
            )}

            {!loading &&
              filteredTeam.map((member) => (
                <div
                  key={member._id}
                  className="group flex items-center justify-between rounded-xl border border-transparent p-2 transition hover:border-[#1E293B] hover:bg-[#161F30]"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="relative">
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center font-bold bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-xs shrink-0 overflow-hidden shadow-sm">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          member.fullName?.[0]?.toUpperCase() || "?"
                        )}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[#0E1626]" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-white group-hover:text-indigo-300 transition">
                        {member.fullName || "Teammate"}
                      </p>
                      <p className="truncate text-[10px] text-[#8B949E]">
                        {member.email || "Active collaborator"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleMessage(member)}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#30363D] bg-[#161B22] text-[#8B949E] transition hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-400"
                    title={`Message ${member.fullName}`}
                  >
                    <MessageSquare size={14} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      </section>

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

function TeamSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((item) => (
        <div key={item} className="flex items-center gap-2.5 rounded-xl p-2 bg-[#161F30]/40">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-[#1E293B]" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-2/3 animate-pulse rounded bg-[#1E293B]" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-[#1E293B]" />
          </div>
        </div>
      ))}
    </div>
  );
}
