import React, { useState, useEffect } from "react";
import {
  MoreHorizontal,
  Shield,
  Star,
  GitBranch,
  Plus,
  Pencil,
  Trash2,
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
  const [editingProject, setEditingProject] = useState(null);

  const authUser = JSON.parse(localStorage.getItem("ChatApp"));
  const user = authUser?.user;
  const token = authUser?.token;

  /* ================= Fetch Users ================= */
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
      // Backend already filters by user membership
      const res = await axios.get("/api/project", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const usersWithCurrent = [
        ...allUsers,
        { _id: user._id, fullName: user.fullName },
      ];

      const projectsData = res.data
        ?.map((proj) => {
          const updatedMembers = proj.members?.map((id) => {
            const member = usersWithCurrent.find((u) => u._id === id);
            return member ? member.fullName : "Unknown User";
          });
          return { ...proj, members: updatedMembers || [] };
        })
        ?.filter((proj) => proj.members?.includes(user?.fullName));

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

  /* ================= Delete Project ================= */
  const handleDelete = async (projectId, e) => {
    e.stopPropagation();
    if (!confirm("Delete this project permanently?")) return;
    try {
      await axios.delete(`/api/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
    } catch (err) {
      console.error("Failed to delete project:", err.message);
      alert("Failed to delete project.");
    }
  };

  /* ================= Edit Project Save ================= */
  const handleEditSave = async (updatedData) => {
    try {
      const res = await axios.put(
        `/api/project/${editingProject._id}`,
        updatedData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchProjects(); // Refresh list to update all members
      setEditingProject(null);
    } catch (err) {
      console.error("Failed to edit project:", err.message);
      alert("Failed to save changes.");
    }
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
      <DashboardLeftSide />

      {/* ===== Main Content ===== */}
      <div className="flex-1 h-screen overflow-y-auto bg-[#0B1220] text-white px-8 py-6">

        {/* Top Header */}
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
            <p className="text-gray-400">Loading projects...</p>
          ) : projects.length > 0 ? (
            projects.map((proj) => (
              <ProjectCard
                key={proj._id}
                project={proj}
                onClick={() => navigate(`/project/${proj._id}`)}
                onEdit={(e) => {
                  e.stopPropagation();
                  setEditingProject(proj);
                }}
                onDelete={(e) => handleDelete(proj._id, e)}
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
            <p className="font-semibold">Start New Project</p>
            <p className="text-gray-400 text-sm mt-1">Templates available</p>
          </div>
        </div>
      </div>

      {/* ===== Create Modal ===== */}
      {isModalOpen && (
        <CreateProjectModal
          onClose={() => setIsModalOpen(false)}
          allUsers={allUsers}
          addProjectToList={addProjectToList}
        />
      )}

      {/* ===== Edit Modal ===== */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          allUsers={allUsers}
          currentUserId={user._id}
          onClose={() => setEditingProject(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}

/* ================= Project Card ================= */
function ProjectCard({ project, onClick, onEdit, onDelete }) {
  const { projectName, description, members, githubData, visibility } = project;

  return (
    <div
      onClick={onClick}
      className="bg-[#0B1120] border border-[#1C2333] rounded-2xl p-4 hover:border-blue-500 transition relative cursor-pointer hover:scale-[1.02] duration-200"
    >
      {/* Edit & Delete Buttons */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={onEdit}
          title="Edit project"
          className="text-gray-500 hover:text-blue-400 transition"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={onDelete}
          title="Delete project"
          className="text-gray-500 hover:text-red-400 transition"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="bg-[#111827] p-3 rounded-xl">
          <Shield className="w-6 h-6 text-purple-500" />
        </div>
        <div>
          <h3 className="font-semibold">{projectName}</h3>
          <p className="text-xs text-gray-400">{visibility}</p>
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-4">{description}</p>

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
      <div className="text-xs text-gray-400 mt-4 ml-2">Members</div>
      <div className="flex flex-wrap gap-2 mt-2">
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

/* ================= Edit Project Modal ================= */
function EditProjectModal({ project, allUsers, currentUserId, onClose, onSave }) {
  const [name, setName] = useState(project.projectName || "");
  const [desc, setDesc] = useState(project.description || "");

  // We store member IDs for the API call.
  // project.members at this point are fullNames (already resolved in parent),
  // so we cross-reference allUsers to rebuild selected IDs.
  const resolveInitialIds = () => {
    const ids = [];
    if (currentUserId) ids.push(currentUserId);
    allUsers.forEach((u) => {
      if (project.members?.includes(u.fullName) && !ids.includes(u._id)) {
        ids.push(u._id);
      }
    });
    return ids;
  };

  const [selectedIds, setSelectedIds] = useState(resolveInitialIds);

  const toggleMember = (userId) => {
    if (userId === currentUserId) return; // current user always stays
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      alert("Project name is required.");
      return;
    }
    onSave({ projectName: name, description: desc, members: selectedIds });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#0B1120] border border-[#1C2333] rounded-2xl p-6 w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Edit Project</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Project Name */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 block mb-1">
            Project Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter project name"
            className="w-full px-3 py-2 bg-[#1E293B] border border-[#1C2333] rounded-lg outline-none text-sm text-white placeholder-gray-500 focus:border-blue-500 transition"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 block mb-1">
            Description
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            placeholder="Describe your project..."
            className="w-full px-3 py-2 bg-[#1E293B] border border-[#1C2333] rounded-lg outline-none text-sm text-white placeholder-gray-500 resize-none focus:border-blue-500 transition"
          />
        </div>

        {/* Members */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 block mb-2">
            Team Members
          </label>

          {allUsers.length === 0 ? (
            <p className="text-xs text-gray-500">No team members available.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
              {allUsers.map((u) => {
                const isCurrentUser = u._id === currentUserId;
                const isChecked = selectedIds.includes(u._id);

                return (
                  <label
                    key={u._id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition cursor-pointer ${isChecked
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-[#1C2333] hover:border-[#2D3748]"
                      } ${isCurrentUser ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isCurrentUser}
                      onChange={() => toggleMember(u._id)}
                      className="accent-blue-500"
                    />
                    <div>
                      <p className="text-sm text-white">
                        {u.fullName}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-gray-500">(you)</span>
                        )}
                      </p>
                      {u.email && (
                        <p className="text-xs text-gray-500">{u.email}</p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {/* Selected count */}
          <p className="text-xs text-gray-500 mt-2">
            {selectedIds.length} member{selectedIds.length !== 1 ? "s" : ""} selected
          </p>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 transition rounded-xl text-sm font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}