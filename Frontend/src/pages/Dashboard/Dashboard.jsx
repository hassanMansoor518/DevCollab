import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  FileCode,
  FileText,
  FolderKanban,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Inbox,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

import DashboardLeftSide from "./DashboardLeftSide";
import ActiveTeam from "./ActiveTeam";
import DashboardHeader from "../../component/DashboardHeader";
import CreateProjectModal from "../Project/CreateProjectModel";
import InviteModal from "./InviteModal";
import { useAuth } from "../../context/AuthProvider";

export default function Dashboard() {
  const navigate = useNavigate();
  const [authData] = useAuth();
  const user = authData?.user;
  const token = authData?.token;

  // Data states
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [activities, setActivities] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTeamMembers, setActiveTeamMembers] = useState([]);

  // UI / Interactive states
  const [loadingFlags, setLoadingFlags] = useState({
    projects: true,
    reports: true,
    activities: true,
    workspaces: true,
    invites: true,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activityFilter, setActivityFilter] = useState("ALL"); // ALL, COMMITS, REPORTS, PROJECTS
  const [activitySearch, setActivitySearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [handlingInviteId, setHandlingInviteId] = useState(null);

  // Projects Carousel Scroll ref & states
  const projectsCarouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Time of day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const getIconForActivity = (type) => {
    switch (type) {
      case "PROJECT_CREATED":
        return FolderKanban;
      case "PROJECT_UPDATED":
        return Settings;
      case "PROJECT_DELETED":
        return Trash2;
      case "REPORT_GENERATED":
        return FileText;
      case "AI_ANALYSIS_GENERATED":
        return Bot;
      case "TEAM_MEMBER_ADDED":
        return UserPlus;
      case "COMMIT_PUSHED":
        return Terminal;
      default:
        return Activity;
    }
  };

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    setIsRefreshing(true);

    const headers = { Authorization: `Bearer ${token}` };

    // 1. Fetch Reports
    axios
      .get("/api/report", { headers })
      .then((res) => {
        setReports(res.data?.reports || []);
      })
      .catch((err) => console.error("Reports fetch failed:", err))
      .finally(() => setLoadingFlags((prev) => ({ ...prev, reports: false })));

    // 2. Fetch Projects
    axios
      .get("/api/project", { headers })
      .then((res) => {
        setProjects(res.data || []);
      })
      .catch((err) => console.error("Projects fetch failed:", err))
      .finally(() => setLoadingFlags((prev) => ({ ...prev, projects: false })));

    // 3. Fetch Activities
    axios
      .get("/api/activity", { headers })
      .then((res) => {
        const list = res.data || [];
        setActivities(
          list.map((act) => ({
            id: act._id,
            type: act.type,
            title: act.title,
            description: act.description,
            time: new Date(act.createdAt),
            icon: getIconForActivity(act.type),
            metadata: act.metadata,
          }))
        );
      })
      .catch((err) => console.error("Activities fetch failed:", err))
      .finally(() => setLoadingFlags((prev) => ({ ...prev, activities: false })));

    // 4. Fetch Workspaces
    axios
      .get("/api/workspace/all-workspace", { headers })
      .then((res) => {
        setWorkspaces(res.data || []);
      })
      .catch((err) => console.error("Workspaces fetch failed:", err))
      .finally(() => setLoadingFlags((prev) => ({ ...prev, workspaces: false })));

    // 5. Fetch Pending Invites & Active Team
    if (user?._id) {
      axios
        .get(`/api/invite/team/pending/${user._id}`, { headers })
        .then((res) => {
          setPendingInvites(Array.isArray(res.data) ? res.data : []);
        })
        .catch((err) => console.error("Pending invites fetch failed:", err))
        .finally(() => setLoadingFlags((prev) => ({ ...prev, invites: false })));

      axios
        .get(`/api/invite/team/active/${user._id}`, { headers })
        .then((res) => {
          const members = res.data || [];
          const unique = Array.from(new Map(members.map((u) => [u._id, u])).values());
          setActiveTeamMembers(unique);
        })
        .catch((err) => console.error("Active team fetch failed:", err));

      axios
        .get("/api/auth/alluser", { headers })
        .then((res) => {
          setAllUsers(
            (res.data || []).filter(
              (u) =>
                u._id !== user._id &&
                !u.fullName?.toLowerCase().includes("bot") &&
                !u.fullName?.toLowerCase().includes("ai") &&
                !u.email?.toLowerCase().includes("bot")
            )
          );
        })
        .catch((err) => console.error("All users fetch failed:", err));
    }

    setTimeout(() => setIsRefreshing(false), 400);
  }, [token, user?._id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle accepting an invitation right from the overview banner
  const handleAcceptInvite = async (inviteId) => {
    try {
      setHandlingInviteId(inviteId);
      await axios.post(
        "/api/invite/invite/accept",
        { inviteId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Invitation accepted! You joined the team.");
      setPendingInvites((prev) => prev.filter((inv) => inv._id !== inviteId));
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept invite");
    } finally {
      setHandlingInviteId(null);
    }
  };

  // Handle declining an invitation
  const handleDeclineInvite = async (inviteId) => {
    try {
      setHandlingInviteId(inviteId);
      await axios.post(
        "/api/invite/invite/cancel",
        { inviteId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast("Invitation declined");
      setPendingInvites((prev) => prev.filter((inv) => inv._id !== inviteId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to decline invite");
    } finally {
      setHandlingInviteId(null);
    }
  };

  // Handle adding project created via modal
  const handleAddProject = (newProj) => {
    setProjects((prev) => [newProj, ...prev]);
    toast.success(`Project "${newProj.projectName}" created!`);
    setIsCreateProjectOpen(false);
  };

  // Handle inviting a user
  const handleSendInvite = async (targetUser) => {
    try {
      await axios.post(
        "/api/invite/invite",
        { senderId: user._id, receiverId: targetUser._id, role: "Developer" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Invitation sent to ${targetUser.fullName}`);
      fetchDashboardData();
    } catch (err) {
      toast.error("Failed to send invite");
    }
  };

  // Health calculation
  const healthScore = useMemo(() => {
    const base = 75;
    const projectBonus = Math.min(projects.length * 4, 15);
    const reportBonus = Math.min(reports.length * 3, 10);
    return Math.min(100, base + projectBonus + reportBonus);
  }, [projects.length, reports.length]);

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Type category filter
      if (activityFilter === "COMMITS" && !act.type?.includes("COMMIT")) return false;
      if (activityFilter === "REPORTS" && !act.type?.includes("REPORT") && !act.type?.includes("AI")) return false;
      if (activityFilter === "PROJECTS" && !act.type?.includes("PROJECT") && !act.type?.includes("TEAM")) return false;

      // Text search
      if (activitySearch.trim()) {
        const q = activitySearch.toLowerCase();
        const title = act.title?.toLowerCase() || "";
        const desc = act.description?.toLowerCase() || "";
        return title.includes(q) || desc.includes(q);
      }
      return true;
    });
  }, [activities, activityFilter, activitySearch]);

  // Filtered recent projects (all matching projects for carousel)
  const filteredProjects = useMemo(() => {
    if (!projectSearch.trim()) return projects;
    return projects.filter(
      (p) =>
        p.projectName?.toLowerCase().includes(projectSearch.toLowerCase()) ||
        p.description?.toLowerCase().includes(projectSearch.toLowerCase()) ||
        p.githubRepo?.toLowerCase().includes(projectSearch.toLowerCase())
    );
  }, [projects, projectSearch]);

  // Carousel scroll check & handler
  const checkCarouselScroll = useCallback(() => {
    if (!projectsCarouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = projectsCarouselRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = projectsCarouselRef.current;
    if (el) {
      checkCarouselScroll();
      el.addEventListener("scroll", checkCarouselScroll);
      window.addEventListener("resize", checkCarouselScroll);
      return () => {
        el.removeEventListener("scroll", checkCarouselScroll);
        window.removeEventListener("resize", checkCarouselScroll);
      };
    }
  }, [filteredProjects, checkCarouselScroll]);

  const handleScrollCarousel = (direction) => {
    if (!projectsCarouselRef.current) return;
    const container = projectsCarouselRef.current;
    // Scroll by approximately the visible width so 3 projects slide out and next 3 slide in
    const scrollAmount = container.clientWidth;
    container.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  // Latest audit report
  const latestReport = useMemo(() => {
    if (!reports || reports.length === 0) return null;
    return reports[0];
  }, [reports]);

  // Relative time helper
  const formatTime = (date) => {
    if (!date) return "Recently";
    const diff = Math.floor((new Date() - new Date(date)) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const handleActivityClick = (act) => {
    if (act.type?.startsWith("PROJECT") || act.type?.startsWith("COMMIT") || act.type?.startsWith("TEAM_MEMBER")) {
      if (act.metadata?.projectId) navigate(`/project/${act.metadata.projectId}`);
      else navigate("/project");
      return;
    }
    if (act.type?.startsWith("REPORT") || act.type?.startsWith("AI_ANALYSIS")) {
      navigate("/report");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B111B] text-[#E6EDF3] font-sans">
      {/* Left Navigation Sidebar */}
      <DashboardLeftSide />

      {/* Main Content Area */}
      <main className="min-w-0 flex-1 overflow-y-auto bg-gradient-to-b from-[#0B111B] via-[#0E1524] to-[#0B111B]">
        <div className="mx-auto flex min-h-full w-full max-w-[1560px] flex-col px-4 py-5 sm:px-6 lg:px-8">
          {/* Top Global Header with User profile and notifications */}
          <DashboardHeader user={user} />

          {/* Pending Invitations Alert Banner */}
          <AnimatePresence>
            {pendingInvites.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                className="mb-6 overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-transparent p-4 sm:p-5 shadow-lg backdrop-blur-md"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-inner">
                      <Inbox size={22} className="animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-semibold text-[#F0F6FC]">
                          Team Invitations Received
                        </h4>
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300">
                          {pendingInvites.length} pending
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#8B949E]">
                        Teammates have invited you to join their engineering workspace.
                      </p>
                    </div>
                  </div>

                  {/* Invites Quick Action List */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {pendingInvites.slice(0, 2).map((invite) => (
                      <div
                        key={invite._id}
                        className="flex items-center gap-3 rounded-xl border border-[#30363D] bg-[#161B22]/90 px-3.5 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                            {invite.sender?.fullName?.[0] || "?"}
                          </div>
                          <div className="text-left">
                            <span className="block text-xs font-medium text-[#E6EDF3] leading-tight">
                              {invite.sender?.fullName || "Teammate"}
                            </span>
                            <span className="block text-[10px] text-[#8B949E] leading-none">
                              {invite.role || "Developer"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 ml-1">
                          <button
                            disabled={handlingInviteId === invite._id}
                            onClick={() => handleAcceptInvite(invite._id)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white transition disabled:opacity-50"
                          >
                            <Check size={12} strokeWidth={2.5} />
                            Accept
                          </button>
                          <button
                            disabled={handlingInviteId === invite._id}
                            onClick={() => handleDeclineInvite(invite._id)}
                            className="rounded-lg p-1 text-[#8B949E] hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                            title="Decline"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ================= HERO COMMAND CENTER ================= */}
          <section className="relative mb-7 overflow-hidden rounded-3xl border border-[#1E293B] bg-gradient-to-br from-[#10192A] via-[#0E1726] to-[#0A101D] shadow-2xl">
            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="pointer-events-none absolute top-1/2 left-4 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl" />

            <div className="relative p-5 sm:p-7 lg:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                {/* Left: User Welcome & Description */}
                <div className="max-w-2xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-400 shadow-sm backdrop-blur-md">
                    <Sparkles size={13} className="text-blue-400" />
                    <span>DevCollab Engineering Hub</span>
                    <span className="inline-block h-1 w-1 rounded-full bg-blue-400" />
                    <span className="text-[11px] text-blue-300 font-mono">v2.4 Active</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                    {greeting}
                    {user?.fullName ? (
                      <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                        , {user.fullName.split(" ")[0]}
                      </span>
                    ) : (
                      "!"
                    )}
                  </h1>

                  <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-[#94A3B8]">
                    Welcome to your unified workspace. Manage code repositories, monitor live AI audits, track team commits, and collaborate in real time.
                  </p>

                  {/* Quick Action Pills */}
                  <div className="mt-5 flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => setIsCreateProjectOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <Plus size={15} strokeWidth={2.5} />
                      New Project
                    </button>

                    <button
                      onClick={() => navigate("/AIAssistant")}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#334155] bg-[#1E293B]/80 hover:bg-[#334155] px-3.5 py-2 text-xs font-medium text-[#E2E8F0] shadow-sm transition hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <Bot size={15} className="text-cyan-400" />
                      AI Assistant
                    </button>

                    <button
                      onClick={() => navigate("/report")}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#334155] bg-[#1E293B]/80 hover:bg-[#334155] px-3.5 py-2 text-xs font-medium text-[#E2E8F0] shadow-sm transition hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <FileText size={15} className="text-emerald-400" />
                      Code Audits
                    </button>

                    <button
                      onClick={() => navigate("/chat")}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#334155] bg-[#1E293B]/80 hover:bg-[#334155] px-3.5 py-2 text-xs font-medium text-[#E2E8F0] shadow-sm transition hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <Users size={15} className="text-indigo-400" />
                      Team Chat
                    </button>

                    <button
                      onClick={() => setIsInviteModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#334155] bg-[#1E293B]/80 hover:bg-[#334155] px-3.5 py-2 text-xs font-medium text-[#E2E8F0] shadow-sm transition hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <UserPlus size={15} className="text-purple-400" />
                      Invite Teammate
                    </button>
                  </div>
                </div>

                {/* Right: Workspace Health & Integrity Dial */}
                <div className="flex shrink-0 flex-col gap-3 rounded-2xl border border-[#1E293B] bg-[#0B111E]/80 p-4 sm:p-5 backdrop-blur-xl lg:min-w-[300px]">
                  <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                        Workspace Health
                      </span>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Optimal
                    </span>
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    {/* Radial Progress Ring */}
                    <div className="relative flex h-16 w-16 items-center justify-center shrink-0">
                      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                        <path
                          className="text-[#1E293B]"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-blue-500 transition-all duration-1000 ease-out"
                          strokeDasharray={`${healthScore}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="absolute text-sm font-extrabold text-white">
                        {healthScore}%
                      </span>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <p className="text-xs font-semibold text-white">
                        System Ready & Indexed
                      </p>
                      <p className="text-[11px] text-[#94A3B8]">
                        {projects.length} repos linked • {reports.length} audits completed
                      </p>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="inline-flex items-center gap-1 text-[10px] text-blue-400">
                          <Zap size={10} /> AI Agent Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================= 4 METRICS KPI CARDS ================= */}
          <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* Metric 1: Projects */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ duration: 0.15 }}
              onClick={() => navigate("/project")}
              className="cursor-pointer rounded-2xl border border-[#1E293B] bg-[#0F172A]/90 p-5 shadow-sm transition hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition">
                  <FolderKanban size={20} />
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#8B949E] group-hover:text-blue-400 transition">
                  View all <ArrowRight size={13} />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8B949E]">
                  Active Projects
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <h3 className="text-3xl font-extrabold tracking-tight text-white">
                    {loadingFlags.projects ? "..." : projects.length}
                  </h3>
                  <span className="text-xs font-semibold text-emerald-400">
                    {projects.filter((p) => p.githubRepo).length} GitHub linked
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-[#94A3B8]">
                  Repositories & code environments
                </p>
              </div>
            </motion.div>

            {/* Metric 2: Team Members */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ duration: 0.15 }}
              onClick={() => navigate("/chat")}
              className="cursor-pointer rounded-2xl border border-[#1E293B] bg-[#0F172A]/90 p-5 shadow-sm transition hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition">
                  <Users size={20} />
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#8B949E] group-hover:text-indigo-400 transition">
                  Team chat <ArrowRight size={13} />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8B949E]">
                  Team Collaborators
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <h3 className="text-3xl font-extrabold tracking-tight text-white">
                    {activeTeamMembers.length}
                  </h3>
                  <span className="text-xs font-semibold text-indigo-400">
                    Active in team
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-[#94A3B8]">
                  Engineers & reviewers onboard
                </p>
              </div>
            </motion.div>

            {/* Metric 3: AI Code Audits */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ duration: 0.15 }}
              onClick={() => navigate("/report")}
              className="cursor-pointer rounded-2xl border border-[#1E293B] bg-[#0F172A]/90 p-5 shadow-sm transition hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition">
                  <Bot size={20} />
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#8B949E] group-hover:text-cyan-400 transition">
                  Reports <ArrowRight size={13} />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8B949E]">
                  AI Code Reviews
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <h3 className="text-3xl font-extrabold tracking-tight text-white">
                    {loadingFlags.reports ? "..." : reports.length}
                  </h3>
                  <span className="text-xs font-semibold text-cyan-400">
                    Audits run
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-[#94A3B8]">
                  Automated security & quality scores
                </p>
              </div>
            </motion.div>

            {/* Metric 4: Workspaces */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ duration: 0.15 }}
              onClick={() => navigate("/project")}
              className="cursor-pointer rounded-2xl border border-[#1E293B] bg-[#0F172A]/90 p-5 shadow-sm transition hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition">
                  <Workflow size={20} />
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#8B949E] group-hover:text-emerald-400 transition">
                  Live <ArrowRight size={13} />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8B949E]">
                  Active Workspaces
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <h3 className="text-3xl font-extrabold tracking-tight text-white">
                    {loadingFlags.workspaces ? "..." : workspaces.length || projects.length}
                  </h3>
                  <span className="text-xs font-semibold text-emerald-400">
                    Sync ready
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-[#94A3B8]">
                  Collaborative coding sessions
                </p>
              </div>
            </motion.div>
          </section>

          {/* ================= RECENT REPOSITORIES & 3-CARD CAROUSEL ================= */}
          <section className="mb-7 rounded-3xl border border-[#1E293B] bg-[#0E1626]/90 p-5 sm:p-6 shadow-md backdrop-blur-md">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-white">Recent Projects & Workspaces</h2>
                  <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
                    {filteredProjects.length} Projects
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#8B949E]">
                  Showing 3 projects per view. Use the navigation buttons to slide through all repositories.
                </p>
              </div>

              {/* Controls: Search, New Project, and Carousel Prev / Next Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8B949E]" />
                  <input
                    type="text"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    placeholder="Filter repos..."
                    className="h-8 w-36 sm:w-48 rounded-xl border border-[#30363D] bg-[#161B22] pl-8 pr-3 text-xs text-[#E6EDF3] placeholder-[#8B949E] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Create Project Button */}
                <button
                  onClick={() => setIsCreateProjectOpen(true)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3 text-xs font-semibold text-white shadow-sm transition"
                >
                  <Plus size={14} />
                  <span>Create</span>
                </button>

                {/* Carousel Navigation Buttons */}
                <div className="flex items-center gap-1.5 pl-1">
                  <button
                    onClick={() => handleScrollCarousel("prev")}
                    disabled={!canScrollLeft}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#30363D] bg-[#161B22] text-[#E6EDF3] transition hover:bg-[#21262D] hover:border-blue-500/50 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Previous projects"
                    aria-label="Previous projects"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => handleScrollCarousel("next")}
                    disabled={!canScrollRight && filteredProjects.length <= 3}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#30363D] bg-[#161B22] text-[#E6EDF3] transition hover:bg-[#21262D] hover:border-blue-500/50 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Next projects"
                    aria-label="Next projects"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Horizontal Scrollable Carousel Container (3 visible cards on desktop) */}
            {loadingFlags.projects ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-44 animate-pulse rounded-2xl border border-[#1E293B] bg-[#161F30]/60 p-5" />
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#30363D] bg-[#111827]/40 py-12 px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 mb-3">
                  <FolderKanban size={24} />
                </div>
                <h4 className="text-sm font-semibold text-white">No projects found</h4>
                <p className="mt-1 text-xs text-[#8B949E] max-w-sm">
                  {projectSearch ? "No repositories match your filter criteria." : "Create your first project or import a repository from GitHub to get started."}
                </p>
                <button
                  onClick={() => setIsCreateProjectOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-semibold text-white shadow transition"
                >
                  <Plus size={14} /> Create New Project
                </button>
              </div>
            ) : (
              <div
                ref={projectsCarouselRef}
                className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory py-1 px-0.5 no-scrollbar"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {filteredProjects.map((proj) => {
                  const memberCount = proj.members?.length || 1;

                  return (
                    <div
                      key={proj._id}
                      className="snap-start shrink-0 w-full md:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] flex flex-col justify-between rounded-2xl border border-[#1E293B] bg-[#10192A] p-5 shadow-sm transition hover:border-blue-500/40 hover:shadow-md hover:shadow-blue-500/5 group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold shadow-sm">
                              <Code2 size={18} />
                            </div>
                            <div className="min-w-0">
                              <h3
                                onClick={() => navigate(`/project/${proj._id}`)}
                                className="truncate text-sm font-bold text-white hover:text-blue-400 cursor-pointer transition"
                              >
                                {proj.projectName}
                              </h3>
                              <p className="truncate text-[11px] text-[#8B949E] font-mono">
                                {proj.githubRepo ? proj.githubRepo.replace("https://github.com/", "") : "Local Dev Project"}
                              </p>
                            </div>
                          </div>

                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            proj.visibility?.toLowerCase().includes("public")
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-slate-700/40 text-slate-300 border border-slate-700"
                          }`}>
                            {proj.visibility?.toLowerCase().includes("public") ? "Public" : "Private"}
                          </span>
                        </div>

                        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[#94A3B8] min-h-[32px]">
                          {proj.description || "No project description provided."}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#1E293B]">
                        <div className="flex items-center justify-between mb-3 text-[11px] text-[#8B949E]">
                          <span className="flex items-center gap-1.5">
                            <Clock size={12} />
                            {formatTime(proj.updatedAt || proj.createdAt)}
                          </span>
                          <span className="flex items-center gap-1 text-slate-300 font-medium">
                            <Users size={12} className="text-indigo-400" />
                            {memberCount} {memberCount === 1 ? "member" : "members"}
                          </span>
                        </div>

                        {/* Direct 1-Click Action Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => navigate(`/project/${proj._id}/workspace`)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 px-3 py-1.5 text-xs font-semibold transition"
                          >
                            <FileCode size={13} />
                            <span>Workspace</span>
                          </button>
                          <button
                            onClick={() => navigate(`/project/${proj._id}`)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-[#E2E8F0] border border-[#334155] px-3 py-1.5 text-xs font-semibold transition"
                          >
                            <GitCommit size={13} />
                            <span>Commits</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ================= 2-COLUMN MAIN HUB: ACTIVITY & SIDEBAR ================= */}
          <section className="grid flex-1 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_410px]">
            {/* LEFT: Live Activity Stream & AI Code Insights */}
            <div className="space-y-6 min-w-0">
              {/* Activity Feed Box */}
              <div className="rounded-3xl border border-[#1E293B] bg-[#0E1626]/90 p-5 sm:p-6 shadow-md backdrop-blur-md">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#1E293B] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white">Live Activity & Pulse Stream</h2>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#8B949E]">
                      Real-time events across projects, commits, AI reports, and team collaborations.
                    </p>
                  </div>

                  {/* Refresh Button */}
                  <button
                    onClick={fetchDashboardData}
                    disabled={isRefreshing}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#30363D] bg-[#161B22] hover:bg-[#21262D] px-3 py-1.5 text-xs font-semibold text-[#C9D1D9] transition disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={isRefreshing ? "animate-spin text-blue-400" : ""} />
                    <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
                  </button>
                </div>

                {/* Filter Tabs & Activity Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 my-4">
                  <div className="flex items-center gap-1 rounded-xl bg-[#161F30] p-1 border border-[#1E293B]">
                    {[
                      { id: "ALL", label: "All Events" },
                      { id: "COMMITS", label: "Commits" },
                      { id: "REPORTS", label: "AI Audits" },
                      { id: "PROJECTS", label: "Projects & Team" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActivityFilter(tab.id)}
                        className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                          activityFilter === tab.id
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#1E293B]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8B949E]" />
                    <input
                      type="text"
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      placeholder="Search events..."
                      className="h-8 w-full sm:w-48 rounded-xl border border-[#30363D] bg-[#161B22] pl-8 pr-3 text-xs text-[#E6EDF3] placeholder-[#8B949E] outline-none transition focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Activity List */}
                <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                  {loadingFlags.activities ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-16 animate-pulse rounded-2xl border border-[#1E293B] bg-[#161F30]/50" />
                      ))}
                    </div>
                  ) : filteredActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#30363D] bg-[#111827]/30 py-12 px-4 text-center">
                      <Activity size={24} className="text-[#8B949E] mb-2" />
                      <p className="text-sm font-semibold text-white">No activity found</p>
                      <p className="mt-1 text-xs text-[#8B949E]">
                        {activitySearch ? "No activity matching your search criteria." : "Events will appear automatically as you create projects, push code, and run AI audits."}
                      </p>
                    </div>
                  ) : (
                    filteredActivities.map((act, index) => {
                      const Icon = act.icon || Activity;
                      const typeLabel = (act.type || "ACTIVITY").replace(/_/g, " ");
                      const isAi = act.type?.includes("REPORT") || act.type?.includes("AI");
                      const isCommit = act.type?.includes("COMMIT");

                      return (
                        <motion.div
                          key={act.id || index}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          onClick={() => handleActivityClick(act)}
                          className="group flex items-start gap-3.5 rounded-2xl border border-[#1E293B] bg-[#10192A]/70 p-3.5 transition hover:border-blue-500/40 hover:bg-[#162136] cursor-pointer"
                        >
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                              isAi
                                ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                                : isCommit
                                ? "border-purple-500/30 bg-purple-500/10 text-purple-400"
                                : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                            }`}
                          >
                            <Icon size={18} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B949E]">
                                {typeLabel}
                              </span>
                              <span className="text-[11px] text-[#6E7681]">
                                {formatTime(act.time)}
                              </span>
                            </div>

                            <h4 className="mt-0.5 text-xs sm:text-sm font-semibold text-white group-hover:text-blue-400 transition">
                              {act.title}
                            </h4>

                            {act.description && (
                              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#94A3B8]">
                                {act.description}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Latest AI Audit Preview Banner */}
              {latestReport && (
                <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 via-[#0E1626] to-[#0E1626] p-5 sm:p-6 shadow-md backdrop-blur-md">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-sm">
                        <Bot size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                            Latest AI Audit
                          </span>
                          <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                            Score: {latestReport.codeQualityScore || 85}%
                          </span>
                        </div>
                        <h4 className="mt-1 text-sm sm:text-base font-bold text-white">
                          {latestReport.project?.projectName || "Codebase Security & Quality Review"}
                        </h4>
                        <p className="mt-1 line-clamp-2 text-xs text-[#94A3B8]">
                          {latestReport.summary || "Complete static analysis and security vulnerability scan performed."}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate("/report")}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition"
                    >
                      <span>Full Audit Report</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Active Teammates & Dev Tools Sidebar */}
            <aside className="space-y-6">
              {/* Active Team Component */}
              <ActiveTeam currentUserId={user?._id} />

              {/* DevCollab Workspace System Insights */}
              <div className="rounded-3xl border border-[#1E293B] bg-[#0E1626]/90 p-5 shadow-md backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-[#1E293B] pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Terminal size={17} className="text-blue-400" />
                    <h3 className="text-sm font-bold text-white">System & Integrations</h3>
                  </div>
                  <span className="text-[10px] font-mono text-[#8B949E]">DevCollab v2.4</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-[#1E293B] bg-[#161F30]/80 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#24292E] text-white">
                        <FaGithub size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">GitHub Integration</p>
                        <p className="text-[10px] text-[#8B949E]">Sync, commits & PRs</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      Connected
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-[#1E293B] bg-[#161F30]/80 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Bot size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">AI Orchestrator Engine</p>
                        <p className="text-[10px] text-[#8B949E]">Multi-file analysis ready</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                      Online
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-[#1E293B] bg-[#161F30]/80 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                        <Users size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Socket Collaboration</p>
                        <p className="text-[10px] text-[#8B949E]">Real-time chat & file sync</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-400">
                      Active
                    </span>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="mt-4 pt-3 border-t border-[#1E293B] grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => navigate("/help")}
                    className="rounded-xl border border-[#30363D] bg-[#161B22] hover:bg-[#21262D] py-2 text-center text-[#C9D1D9] font-medium transition"
                  >
                    Documentation
                  </button>
                  <button
                    onClick={() => navigate("/settings")}
                    className="rounded-xl border border-[#30363D] bg-[#161B22] hover:bg-[#21262D] py-2 text-center text-[#C9D1D9] font-medium transition"
                  >
                    Workspace Settings
                  </button>
                </div>
              </div>
            </aside>
          </section>
        </div>
      </main>

      {/* Modal: Create New Project */}
      {isCreateProjectOpen && (
        <CreateProjectModal
          onClose={() => setIsCreateProjectOpen(false)}
          addProjectToList={handleAddProject}
        />
      )}

      {/* Modal: Invite Team Member */}
      {isInviteModalOpen && (
        <InviteModal
          users={allUsers}
          onClose={() => setIsInviteModalOpen(false)}
          onInvite={handleSendInvite}
        />
      )}
    </div>
  );
}
