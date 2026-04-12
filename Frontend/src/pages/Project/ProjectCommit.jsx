import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { GitCommit, Code, Plus, RotateCcw, Folder, File } from "lucide-react";

import DashboardLeftSide from "../Dashboard/DashboardLeftSide";
import DashboardHeader from "../../component/DashboardHeader";
import CommitCard from "../../component/CommitCard";
import CodeViewer from "./CodeViewer";

export default function ProjectCommit() {
  const { id } = useParams();
  const authUser = JSON.parse(localStorage.getItem("ChatApp") || "{}");
  const user = authUser?.user;

  const [project, setProject] = useState(null);
  const [commits, setCommits] = useState([]);
  const [loadingCommits, setLoadingCommits] = useState(true);
  const [activeTab, setActiveTab] = useState("commits");
  const [fileTree, setFileTree] = useState([]);
  const [currentPath, setCurrentPath] = useState("");

  /* ================= Fetch Project ================= */
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/api/project/${id}`);
        setProject(res.data.project || res.data);
      } catch (err) {
        console.error("Project fetch failed:", err.response?.data || err.message);
      }
    };
    fetchProject();
  }, [id]);

  /* ================= Fetch Commits ================= */
  useEffect(() => {
    const fetchCommits = async () => {
      try {
        setLoadingCommits(true);
        const res = await axios.get(
          `http://localhost:3001/api/project/${id}/commits`,
          {
            headers: { Authorization: `Bearer ${authUser.token || ""}` },
          }
        );
        setCommits(res.data.commits || res.data || []);
      } catch (err) {
        console.error("Failed to fetch commits:", err.response?.data || err.message);
        setCommits([]);
      } finally {
        setLoadingCommits(false);
      }
    };
    if (activeTab === "commits") fetchCommits();
  }, [id, activeTab]);

  return (
    <div className="flex h-screen">
      <DashboardLeftSide />
      <div className="flex-1 h-screen overflow-y-auto bg-gradient-to-br from-[#050B18] via-[#071428] to-[#030712] text-white px-8 py-6">
        <DashboardHeader user={user} />

        {project && (
        <div className="mt-8 bg-gradient-to-r from-[#0D1B2A] to-[#111827] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Project Avatar */}
         
            <div>
              <h1 className="text-xl font-bold text-white">{project.projectName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                <p className="text-gray-400 text-sm">Branch: <span className="text-green-400 font-medium">main</span></p>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-white font-semibold text-lg">{commits.length}</p>
              <p className="text-gray-500 text-xs">Commits</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-white font-semibold text-lg">main</p>
              <p className="text-gray-500 text-xs">Branch</p>
            </div>
          </div>
        </div>
      )}

        {/* Tabs */}
        <div className="mt-6 border-b border-white/10 flex gap-6 pb-3 text-sm">
          <Tab
            icon={<GitCommit size={16} />}
            label="Commits"
            active={activeTab === "commits"}
            onClick={() => setActiveTab("commits")}
          />
          <Tab
            icon={<Code size={16} />}
            label="Code View"
            active={activeTab === "code"}
            onClick={() => setActiveTab("code")}
          />
        </div>

        {/* Tab Content */}
        {activeTab === "commits" && (
          <div className="mt-6 space-y-6">
            {loadingCommits ? (
              <div className="flex items-center gap-3 text-gray-400">
                <RotateCcw className="animate-spin" size={16} />
                Loading commits...
              </div>
            ) : commits.length > 0 ? (
              commits.map((c) => (
                <CommitCard
                  key={c.sha}
                  name={c.author}
                  title={c.message}
                  time={new Date(c.date).toLocaleString()}
                  url={c.url}
                />
              ))
            ) : (
              <p className="text-gray-400 text-sm">No commits found.</p>
            )}
          </div>
        )}

        {activeTab === "code" && (
          <div className="mt-6">
            <h2 className="font-semibold text-lg mb-3">Repository Files</h2>
            <CodeViewer projectId={id} filePath={currentPath} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= Tab Component ================= */
function Tab({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 cursor-pointer ${
        active ? "text-blue-400" : "text-gray-400 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </div>
  );
}