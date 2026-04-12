import React, { useState, useEffect } from "react";
import {
  MoreHorizontal,
  Shield,
  Star,
  GitBranch,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLeftSide from "../Dashboard/DashboardLeftSide";
import CreateProjectModal from "./CreateProjectModel";
import DashboardHeader from "../../component/DashboardHeader";
import axios from "axios";

export default function ProjectsDashboard() {
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  // ✅ Safe localStorage parse
  const authUser = JSON.parse(localStorage.getItem("ChatApp") || "{}");
  const user = authUser?.user || {};

  /* ================= Fetch All Users ================= */
  const fetchAllUsers = async () => {
    if (!user?._id) return;

    try {
      const res = await axios.get(
        `http://localhost:3001/api/invite/team/active/${user._id}`
      );
      setAllUsers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err.message);
    }
  };

  /* ================= Fetch Projects ================= */
  const fetchProjects = async () => {
    if (!user?._id) return;

    setLoading(true);

    try {
      const res = await axios.get(
        "http://localhost:3001/api/project/"
      );

      const usersWithCurrent = [
        ...allUsers,
        { _id: user._id, fullName: user.fullName },
      ];

      const projectsData = res.data
        ?.map((proj) => {
          const updatedMembers = proj.members?.map((id) => {
            const member = usersWithCurrent.find(
              (u) => u._id === id
            );
            return member ? member.fullName : "Unknown User";
          });

          return { ...proj, members: updatedMembers || [] };
        })
        ?.filter((proj) =>
          proj.members?.includes(user?.fullName)
        );

      setProjects(projectsData || []);
    } catch (err) {
      console.error("Failed to fetch projects:", err.message);
    } finally {
      setLoading(false);
    }
  };



  /* ================= Add Project ================= */
  const addProjectToList = (project) => {
    setProjects((prev) => [project, ...prev]);
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (allUsers.length > 0) {
      fetchProjects();
    }
  }, [allUsers]);



  return (
    <div className="flex h-screen">
      {/* ===== Sidebar ===== */}
      <DashboardLeftSide/>

      {/* ===== Main Content ===== */}
      <div className="flex-1 h-screen overflow-y-auto bg-gradient-to-br from-[#050B18] via-[#071428] to-[#030712] text-white px-8 py-6">
        
        {/* 🔥 Top Header */}
        <DashboardHeader user={user} />

        {/* ===== Page Title Section ===== */}
        <div className="mt-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-gray-400 text-sm mt-2">
              Manage and track your team's development lifecycle.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition px-6 py-3 rounded-xl shadow-[0_0_30px_rgba(59,130,246,0.5)]"
          >
            <Plus className="w-5 h-5" />
            Create Project
          </button>
        </div>

        {/* ===== Projects Grid ===== */}
        <div className="mt-8 grid grid-cols-3 gap-6">
          {loading ? (
            <p className="text-gray-400">
              Loading projects...
            </p>
          ) : projects.length > 0 ? (
            projects.map((proj) => (
              <ProjectCard
                key={proj._id}
                project={proj}
                onClick={() =>
                  navigate(`/project/${proj._id}`)
                }
              />
            ))
          ) : (
            <p className="text-gray-500 col-span-3 text-center mt-10">
              No projects found.
            </p>
          )}

          {/* ===== New Project Card ===== */}
          <div
            onClick={() => setIsModalOpen(true)}
            className="border border-dashed border-[#1C2333] rounded-2xl flex flex-col items-center justify-center h-[280px] bg-[#0B1120] hover:border-blue-500 transition cursor-pointer"
          >
            <div className="w-14 h-14 bg-[#111827] rounded-full flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <p className="font-semibold">
              Start New Project
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Templates available
            </p>
          </div>
        </div>
      </div>

      {/* ===== Modal ===== */}
      {isModalOpen && (
        <CreateProjectModal
          onClose={() => setIsModalOpen(false)}
          allUsers={allUsers}
          addProjectToList={addProjectToList}
        />
      )}
    </div>
  );
}

/* ================= Project Card ================= */

function ProjectCard({ project, onClick }) {
  const {
    projectName,
    description,
    members,
    githubData,
    visibility,
  } = project;

  return (
    <div
      onClick={onClick}
      className="bg-[#0B1120] border border-[#1C2333] rounded-2xl p-4 hover:border-blue-500 transition relative cursor-pointer hover:scale-[1.02] duration-200"
    >
      <div className="absolute top-4 right-4">
        <MoreHorizontal className="w-5 h-5 text-gray-500" />
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="bg-[#111827] p-3 rounded-xl">
          <Shield className="w-6 h-6 text-purple-500" />
        </div>
        <div>
          <h3 className="font-semibold">
            {projectName}
          </h3>
          <p className="text-xs text-gray-400">
            {visibility}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-4">
        {description}
      </p>

      {/* GitHub Info */}
      {githubData && (
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Star className="w-4 h-4" />
            {githubData.stars}
          </div>

          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <GitBranch className="w-4 h-4" />
            {githubData.forks}
          </div>
        </div>
      )}

      {/* Members */}
      <div className="text-xs text-gray-400 mt-4 ml-2">
        Members
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {/* {members?.map((mem, i) => (
          <span
            key={i}
            className="text-xs bg-[#111827] px-2 py-1 rounded-full text-gray-300 border border-[#1C2333]"
          >
            {mem}
          </span>
        ))} */}

  {members?.map((mem, i) => (
  <span
    key={i}
    className="text-xs bg-[#111827] px-2 py-1 rounded-full text-gray-300 border border-[#1C2333]"
  >
    {typeof mem === "object" ? mem.fullName : mem}
  </span>
))}
      </div>
    </div>
  );
}
