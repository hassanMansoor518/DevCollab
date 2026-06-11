import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiTrendingUp,
  FiUsers,
  FiFolder,
  FiCpu,
  FiFileText,
  FiSettings,
  FiUserPlus,
  FiTrash2,
  FiTerminal,
  FiActivity
} from "react-icons/fi";

import { AiOutlineStar } from "react-icons/ai";
import { motion } from "framer-motion";

import DashboardLeftSide from "./DashboardLeftSide";
import ActiveTeam from "./ActiveTeam";
import DashboardHeader from "../../component/DashboardHeader";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    projects: 0,
    members: 0,
    reviews: 0,
    reports: 0
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const authUser = JSON.parse(localStorage.getItem("ChatApp"));
  const user = authUser?.user;
  const token = authUser?.token;

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [reportsRes, projectsRes, activityRes] = await Promise.all([
        axios.get("/api/report", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/project", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/activity", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const reports = reportsRes.data.reports || [];
      const projects = projectsRes.data || [];
      const systemActivities = activityRes.data || [];

      // Calculate unique team members across the user's projects
      const uniqueMembers = new Set();
      projects.forEach(p => {
        if (p.members) {
          p.members.forEach(m => uniqueMembers.add(m.toString() || m));
        }
      });

      // Map system activities
      const mappedActivities = systemActivities.map(act => ({
        id: act._id,
        type: act.type,
        title: act.title,
        description: act.description,
        time: new Date(act.createdAt),
        icon: getIconForActivity(act.type),
        metadata: act.metadata
      }));

      setActivities(mappedActivities);

      setStats({
        projects: projects.length,
        members: uniqueMembers.size,
        reviews: reports.length,
        reports: reports.length
      });

    } catch (err) {
      console.error("Dashboard data fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const getIconForActivity = (type) => {
    switch (type) {
      case "PROJECT_CREATED": return <FiFolder className="text-info" />;
      case "PROJECT_UPDATED": return <FiSettings className="text-warning" />;
      case "PROJECT_DELETED": return <FiTrash2 className="text-error" />;
      case "REPORT_GENERATED":
      case "AI_ANALYSIS_GENERATED": return <AiOutlineStar className="text-primary" />;
      case "TEAM_MEMBER_ADDED": return <FiUserPlus className="text-success" />;
      case "COMMIT_PUSHED": return <FiTerminal className="text-text-muted" />;
      default: return <FiActivity className="text-info" />;
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards = [
    { title: "My Projects", value: stats.projects, icon: <FiFolder />, color: "text-info" },
    { title: "Team Members", value: stats.members, icon: <FiUsers />, color: "text-primary" },
    { title: "AI Reviews", value: stats.reviews, icon: <FiCpu />, color: "text-error" },
    { title: "Reports Generated", value: stats.reports, icon: <FiTrendingUp />, color: "text-success" },
  ];

  const formatTime = (date) => {
    const diff = Math.floor((new Date() - date) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleActivityClick = (act) => {
    if (act.type.startsWith('PROJECT') || act.type.startsWith('COMMIT') || act.type.startsWith('TEAM_MEMBER')) {
      if (act.metadata?.projectId) navigate(`/project/${act.metadata.projectId}`);
      else navigate('/project');
    } else if (act.type.startsWith('REPORT') || act.type.startsWith('AI_ANALYSIS')) {
      navigate('/report');
    }
  };

  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden">
      <DashboardLeftSide />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="max-w-[1400px] w-full mx-auto px-5 pt-6 pb-2 shrink-0">

          <div className="space-y-2">
            <DashboardHeader user={user} />
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Activity Mission Control</h1>
              <p className="text-sm text-text-secondary pb-5 mt-2">Monitoring your specific engineering events and AI audits.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border-subtle rounded-2xl p-4 hover:border-primary/20 transition shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-text-muted font-medium">{s.title}</p>
                    <h2 className="text-xl font-semibold mt-1 text-text-primary">{loading ? "..." : s.value}</h2>
                  </div>
                  <div className={`${s.color} text-lg p-2 bg-primary-soft rounded-lg`}>{s.icon}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="max-w-[1400px] w-full mx-auto px-5 pb-6 flex-1 min-h-0">
          <div className="grid lg:grid-cols-3 gap-4 h-full">
            <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between mb-2 px-1 shrink-0">
                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest my-4">My System Events</h3>
                <span className="text-[10px] font-bold bg-primary-soft text-primary px-2 py-0.5 rounded border border-primary/20 tracking-wider">LIVE FEED</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-24 bg-surface border border-border-default rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : activities.length === 0 ? (
                  <div className="bg-card border border-border-subtle rounded-2xl p-10 text-center text-text-muted text-sm">
                    No system events recorded for your projects yet.
                  </div>
                ) : (
                  activities.map((act, i) => (
                    <motion.div
                      key={act.id || i}
                      onClick={() => handleActivityClick(act)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-card border border-border-subtle rounded-2xl p-5 hover:border-primary/50 cursor-pointer transition group"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-surface border border-border-subtle rounded-lg group-hover:bg-primary-soft group-hover:text-primary transition-colors">
                            {act.icon}
                          </div>
                          <span className="text-xs text-text-muted font-bold uppercase tracking-tighter">
                            {act.type.replace('_', ' ')} • {formatTime(act.time)}
                          </span>
                        </div>
                        {(act.type === 'REPORT_GENERATED' || act.type === 'PROJECT_CREATED') && (
                          <span className="text-success text-[10px] font-black tracking-widest border border-success/30 bg-success-soft px-2 py-0.5 rounded uppercase">
                            SUCCESS
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-text-primary">{act.title}</h3>
                      <p className="text-sm text-text-secondary mt-1 leading-relaxed">{act.description}</p>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col h-full overflow-hidden">
              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-card border border-border-subtle rounded-2xl p-5 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all" />
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-text-primary">
                    <FiActivity className="text-primary" /> My Workspace Summary
                  </h3>
                  <div className="text-sm text-text-secondary space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Avg. Health Score</span>
                      <span className="text-success font-bold">88/100</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Deploy Readiness</span>
                      <span className="text-info font-bold">OPTIMAL</span>
                    </div>
                    <div className="pt-4 border-t border-border-subtle space-y-2">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Workspace Stats</p>
                      <p>• {stats.projects} Active Repositories</p>
                      <p>• {stats.reports} Technical Audits</p>
                      <p>• {stats.members} Collaborators</p>
                    </div>
                    <button className="w-full mt-4 py-3 bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95">
                      Security Dashboard
                    </button>
                  </div>
                </div>
                <ActiveTeam currentUserId={user?._id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;