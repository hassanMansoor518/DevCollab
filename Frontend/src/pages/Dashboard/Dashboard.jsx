import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import {
  Activity,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  FileText,
  FolderKanban,
  GitCommit,
  Settings,
  Sparkles,
  Terminal,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  Workflow,
} from "lucide-react";

import DashboardLeftSide from "./DashboardLeftSide";
import ActiveTeam from "./ActiveTeam";
import DashboardHeader from "../../component/DashboardHeader";
import EmptyState from "../../component/EmptyState";
import { useAuth } from "../../context/AuthProvider";

const emptyStats = {
  projects: 0,
  members: 0,
  reviews: 0,
  reports: 0,
  workspaces: 0,
  tasks: 0,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(emptyStats);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [authData] = useAuth();
  const user = authData?.user;
  const token = authData?.token;

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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [reportsRes, projectsRes, activityRes, workspaceRes] = await Promise.all([
        axios.get("/api/report", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/project", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/activity", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/workspace/all-workspace", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const reports = reportsRes.data.reports || [];
      const projects = projectsRes.data || [];
      const systemActivities = activityRes.data || [];
      const workspaces = workspaceRes.data || [];
      const uniqueMembers = new Set();

      projects.forEach((project) => {
        (project.members || []).forEach((member) => uniqueMembers.add(member?.toString?.() || member));
      });

      setActivities(
        systemActivities.map((act) => ({
          id: act._id,
          type: act.type,
          title: act.title,
          description: act.description,
          time: new Date(act.createdAt),
          icon: getIconForActivity(act.type),
          metadata: act.metadata,
        }))
      );

      setStats({
        projects: projects.length,
        members: uniqueMembers.size,
        reviews: reports.length,
        reports: reports.length,
        workspaces: workspaces.length,
        tasks: 0,
      });
    } catch (err) {
      console.error("Dashboard data fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards = useMemo(
    () => [
      {
        title: "Projects",
        label: "Active repositories",
        value: stats.projects,
        icon: FolderKanban,
        tone: "text-info bg-info-soft border-info/20",
      },
      {
        title: "Team Members",
        label: "Unique collaborators",
        value: stats.members,
        icon: Users,
        tone: "text-primary bg-primary-soft border-primary/20",
      },
      {
        title: "AI Reviews",
        label: "Code audits generated",
        value: stats.reviews,
        icon: Bot,
        tone: "text-error bg-error-soft border-error/20",
      },
      {
        title: "Reports",
        label: "Shared insights",
        value: stats.reports,
        icon: TrendingUp,
        tone: "text-success bg-success-soft border-success/20",
      },
    ],
    [stats]
  );

  const healthScore = Math.min(100, 72 + stats.projects * 3 + stats.reports * 2);

  const formatTime = (date) => {
    const diff = Math.floor((new Date() - date) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
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
    <div className="flex h-screen overflow-hidden bg-background text-text-primary">
      <DashboardLeftSide />

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-[1440px] flex-col px-4 py-5 sm:px-6 lg:px-8">
          <DashboardHeader user={user} />

          <section className="mb-6 overflow-hidden rounded-3xl border border-border-subtle bg-card shadow-sm">
            <div className="relative p-5 sm:p-6 lg:p-7">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-info/10 blur-3xl" />

              <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface/70 px-3 py-1 text-xs font-semibold text-text-secondary backdrop-blur">
                    <Sparkles size={13} className="text-primary" />
                    Engineering workspace overview
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-text-primary">
                    Welcome back{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}.
                  </h1>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">
                    Track your projects, AI reviews, reports, team activity, and workspace health from one focused control center.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border-subtle bg-surface/70 p-2 backdrop-blur">
                  <MiniMetric label="Health" value={`${healthScore}%`} />
                  <MiniMetric label="Workspaces" value={stats.workspaces} />
                  <MiniMetric label="Events" value={activities.length} />
                </div>
              </div>
            </div>
          </section>

          <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((item, index) => (
              <StatCard key={item.title} item={item} loading={loading} index={index} />
            ))}
          </section>

          <section className="grid flex-1 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="min-w-0 rounded-2xl border border-border-subtle bg-card shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border-subtle p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                  <h2 className="text-base font-semibold text-text-primary">Recent Activity</h2>
                  <p className="mt-1 text-xs text-text-muted">Live project events, reports, commits, and team updates.</p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-success/20 bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Live feed
                </span>
              </div>

              <div className="max-h-[680px] overflow-y-auto p-3 sm:p-4">
                {loading ? (
                  <ActivitySkeleton />
                ) : activities.length === 0 ? (
                  <EmptyActivity />
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity, index) => (
                      <ActivityItem
                        key={activity.id || index}
                        activity={activity}
                        index={index}
                        formatTime={formatTime}
                        onClick={() => handleActivityClick(activity)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-5">
              <WorkspaceSummary stats={stats} activities={activities} loading={loading} healthScore={healthScore} />
              <ActiveTeam currentUserId={user?._id} />
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
};

function MiniMetric({ label, value }) {
  return (
    <div className="min-w-[82px] rounded-xl px-3 py-2 text-center">
      <p className="text-lg font-semibold text-text-primary">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
    </div>
  );
}

function StatCard({ item, loading, index }) {
  const Icon = item.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-2xl border border-border-subtle bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${item.tone}`}>
          <Icon size={20} />
        </div>
        <ArrowUpRight size={16} className="text-text-muted opacity-0 transition group-hover:opacity-100" />
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{item.title}</p>
        <div className="mt-1 flex items-end gap-2">
          {loading ? (
            <div className="h-8 w-16 animate-pulse rounded-lg bg-muted" />
          ) : (
            <h3 className="text-3xl font-semibold tracking-tight text-text-primary">{item.value}</h3>
          )}
          <span className="mb-1 text-xs text-success">+ live</span>
        </div>
        <p className="mt-2 text-sm text-text-secondary">{item.label}</p>
      </div>
    </motion.article>
  );
}

function ActivityItem({ activity, index, formatTime, onClick }) {
  const Icon = activity.icon || Activity;
  const typeLabel = (activity.type || "ACTIVITY").replace(/_/g, " ");
  const success = activity.type === "REPORT_GENERATED" || activity.type === "PROJECT_CREATED";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group w-full rounded-2xl border border-border-subtle bg-surface/70 p-4 text-left transition hover:border-primary/30 hover:bg-hover-bg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
    >
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-card text-primary transition group-hover:border-primary/30 group-hover:bg-primary-soft">
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              {typeLabel} · {formatTime(activity.time)}
            </p>
            {success && (
              <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success-soft px-2 py-0.5 text-[10px] font-bold text-success">
                <CheckCircle2 size={11} />
                Success
              </span>
            )}
          </div>
          <h3 className="mt-1 text-sm font-semibold text-text-primary sm:text-base">{activity.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-text-secondary">{activity.description}</p>
        </div>
      </div>
    </motion.button>
  );
}

function WorkspaceSummary({ stats, activities, loading, healthScore }) {
  const rows = [
    { label: "Total Workspaces", value: stats.workspaces, icon: Workflow },
    { label: "Active Projects", value: stats.projects, icon: FolderKanban },
    { label: "Team Members", value: stats.members, icon: Users },
    { label: "Recent Events", value: activities.length, icon: GitCommit },
  ];

  return (
    <section className="rounded-2xl border border-border-subtle bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Workspace Summary</h2>
          <p className="mt-1 text-xs text-text-muted">Operational health across your workspace.</p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary-soft px-3 py-2 text-right text-primary">
          <p className="text-lg font-semibold">{loading ? "--" : `${healthScore}%`}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide">Health</p>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface/70 px-3 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-text-secondary">
                  <Icon size={15} />
                </div>
                <span className="text-sm font-medium text-text-secondary">{row.label}</span>
              </div>
              {loading ? (
                <div className="h-4 w-8 animate-pulse rounded bg-muted" />
              ) : (
                <span className="text-sm font-semibold text-text-primary">{row.value}</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="rounded-2xl border border-border-subtle bg-surface/70 p-4">
          <div className="flex gap-3">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-3 w-1/3 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyActivity() {
  return (
    <EmptyState
      icon={<Activity size={22} />}
      title="No Activity Yet"
      description="Workspace events and updates will appear here as your team creates projects and collaborates."
      minHeight="min-h-[340px]"
    />
  );
}

export default Dashboard;
