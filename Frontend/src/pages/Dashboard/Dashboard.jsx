import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiCheckCircle,
  FiMessageSquare,
  FiTrendingUp,
  FiUsers,
  FiFolder,
  FiCpu,
  FiFileText,
  FiZap,
  FiSettings,
  FiUserMinus,
  FiTerminal
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
      
      const [reportsRes, projectsRes, activityRes, usersRes] = await Promise.all([
        axios.get("/api/report", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/project", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/activity", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/auth/alluser", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const reports = reportsRes.data.reports || [];
      const projects = projectsRes.data || [];
      const messages = activityRes.data || [];
      const allUsers = usersRes.data || [];

      // Map System Activities to UI icons
      const iconMap = {
        PROJECT_CREATED: <FiFolder className="text-blue-400" />,
        PROJECT_UPDATED: <FiFolder className="text-blue-300" />,
        PROJECT_DELETED: <FiUserMinus className="text-red-400" />,
        TEAM_MEMBER_ADDED: <FiUsers className="text-green-400" />,
        AI_ANALYSIS_GENERATED: <AiOutlineStar className="text-violet-400" />,
        REPORT_GENERATED: <FiFileText className="text-purple-400" />,
        COMMIT_PUSHED: <FiTerminal className="text-orange-400" />,
        CODE_DEPLOYED: <FiZap className="text-yellow-400" />,
        SETTINGS_UPDATED: <FiSettings className="text-gray-400" />
      };

      const systemActivities = activityRes.data.map(a => ({
        id: a._id,
        type: a.type,
        title: a.title,
        description: a.description,
        time: new Date(a.createdAt),
        icon: iconMap[a.type] || <FiZap className="text-blue-400" />
      }));

      setActivities(systemActivities);

      setStats({
        projects: projects.length,
        members: allUsers.length,
        reviews: reports.length, // Using reports as proxy for AI reviews
        reports: reports.length
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

  const statCards = [
    { title: "Projects", value: stats.projects, icon: <FiFolder />, color: "text-blue-400" },
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
              <p className="text-xs text-blue-400 tracking-widest uppercase mt-7">Dashboard</p>
              <h1 className="text-3xl font-semibold tracking-tight">Dashboard Overview</h1>
              <p className="text-sm text-gray-400">Monitor system activity and AI insights in real time.</p>
            </div>
          </div>

          {/* STATS SECTION */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#111827]/70 border border-white/[0.05] rounded-2xl p-4 hover:border-blue-500/20 transition"
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
            {/* FEED */}
            <div className="lg:col-span-2 space-y-4">
              {loading ? (
                <p className="text-sm text-gray-500">Syncing workspace activity...</p>
              ) : activities.length === 0 ? (
                <div className="bg-[#111827]/70 border border-white/[0.05] rounded-2xl p-10 text-center text-gray-500 text-sm">
                  No recent activity detected in your workspace.
                </div>
              ) : (
                activities.map((act, i) => (
                  <motion.div
                    key={act.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-[#111827]/70 border border-white/[0.05] rounded-2xl p-5 hover:border-blue-500/20 transition"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        {act.icon}
                        <span className="text-xs text-gray-500 uppercase tracking-tighter">
                          {act.type} • {formatTime(act.time)}
                        </span>
                      </div>
                      {act.type === 'AUDIT' && (
                        <span className="text-green-400 text-xs flex items-center gap-1 font-bold">
                          SUCCESS <FiCheckCircle />
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-medium">{act.title}</h3>
                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">{act.description}</p>
                  </motion.div>
                ))
              )}
            </div>

            {/* SIDEBAR */}
            <div className="space-y-4">
              <div className="bg-[#111827]/70 border border-white/[0.05] rounded-2xl p-5">
                <h3 className="text-base font-medium mb-3">AI Workspace Summary</h3>
                <div className="text-sm text-gray-400 space-y-3">
                  <div className="flex items-center gap-2">
                    <FiTrendingUp className="text-green-400" />
                    <span>Productivity Score: <strong>Stable</strong></span>
                  </div>
                  <p>• {stats.projects} active projects detected</p>
                  <p>• {stats.reports} engineering audits generated</p>
                  <p>• {stats.members} team members collaborating</p>
                  <button className="w-full mt-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400 text-xs font-bold hover:bg-blue-600 hover:text-white transition-all">
                    Generate Health Report
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