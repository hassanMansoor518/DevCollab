import React, { useState, useEffect } from "react";
import axios from "axios";
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
        icon: getIconForActivity(act.type)
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
      case "PROJECT_CREATED": return <FiFolder className="text-blue-400" />;
      case "PROJECT_UPDATED": return <FiSettings className="text-orange-400" />;
      case "PROJECT_DELETED": return <FiTrash2 className="text-red-400" />;
      case "REPORT_GENERATED": 
      case "AI_ANALYSIS_GENERATED": return <AiOutlineStar className="text-violet-400" />;
      case "TEAM_MEMBER_ADDED": return <FiUserPlus className="text-green-400" />;
      case "COMMIT_PUSHED": return <FiTerminal className="text-gray-400" />;
      default: return <FiActivity className="text-blue-400" />;
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards = [
    { title: "My Projects", value: stats.projects, icon: <FiFolder />, color: "text-blue-400" },
    { title: "Team Members", value: stats.members, icon: <FiUsers />, color: "text-violet-400" },
    { title: "AI Reviews", value: stats.reviews, icon: <FiCpu />, color: "text-pink-400" },
    { title: "Reports Generated", value: stats.reports, icon: <FiTrendingUp />, color: "text-green-400" },
  ];

  const formatTime = (date) => {
    const diff = Math.floor((new Date() - date) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-screen bg-[#0B1220] text-white overflow-hidden">
      <DashboardLeftSide />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-5 py-6 space-y-6">
          
          <div className="space-y-2">
            <DashboardHeader user={user} />
            <div>
              <p className="text-xs text-blue-400 tracking-widest uppercase mt-7">Personal Workspace</p>
              <h1 className="text-3xl font-semibold tracking-tight">Activity Mission Control</h1>
              <p className="text-sm text-gray-400">Monitoring your specific engineering events and AI audits.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#111827]/70 border border-white/[0.05] rounded-2xl p-4 hover:border-blue-500/20 transition shadow-lg"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">{s.title}</p>
                    <h2 className="text-xl font-semibold mt-1">{loading ? "..." : s.value}</h2>
                  </div>
                  <div className={`${s.color} text-lg`}>{s.icon}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">My System Events</h3>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">LIVE FEED</span>
              </div>
              
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-white/[0.03] border border-white/[0.05] rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="bg-[#111827]/70 border border-white/[0.05] rounded-2xl p-10 text-center text-gray-500 text-sm">
                  No system events recorded for your projects yet.
                </div>
              ) : (
                activities.map((act, i) => (
                  <motion.div
                    key={act.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-[#111827]/70 border border-white/[0.05] rounded-2xl p-5 hover:border-blue-500/20 transition group"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/[0.03] rounded-lg group-hover:bg-blue-500/10 transition-colors">
                          {act.icon}
                        </div>
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-tighter">
                          {act.type.replace('_', ' ')} • {formatTime(act.time)}
                        </span>
                      </div>
                      {(act.type === 'REPORT_GENERATED' || act.type === 'PROJECT_CREATED') && (
                        <span className="text-green-400 text-[10px] font-black tracking-widest border border-green-400/30 px-2 py-0.5 rounded uppercase">
                          SUCCESS
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-gray-100">{act.title}</h3>
                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">{act.description}</p>
                  </motion.div>
                ))
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-[#111827]/70 border border-white/[0.05] rounded-2xl p-5 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-all" />
                <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                  <FiActivity className="text-blue-500" /> My Workspace Summary
                </h3>
                <div className="text-sm text-gray-400 space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Avg. Health Score</span>
                    <span className="text-green-400 font-bold">88/100</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Deploy Readiness</span>
                    <span className="text-blue-400 font-bold">OPTIMAL</span>
                  </div>
                  <div className="pt-4 border-t border-white/[0.05] space-y-2">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Workspace Stats</p>
                    <p>• {stats.projects} Active Repositories</p>
                    <p>• {stats.reports} Technical Audits</p>
                    <p>• {stats.members} Collaborators</p>
                  </div>
                  <button className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95">
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
  );
};

export default Dashboard;