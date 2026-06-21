import React, { useState, useEffect } from "react";
import {
  MoreHorizontal,
  Shield,
  Star,
  GitBranch,
  Plus,
  Pencil,
  Trash2,
  Folder,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLeftSide from "../Dashboard/DashboardLeftSide";
import CreateProjectModal from "./CreateProjectModel";
import DashboardHeader from "../../component/DashboardHeader";
import EmptyState from "../../component/EmptyState";
import { useAuth } from "../../context/AuthProvider";
import axios from "axios";

export default function ProjectsDashboard() {
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [editingProject, setEditingProject] = useState(null);

  const [authData] = useAuth();
  const user = authData?.user;
  const token = authData?.token;

  /* ================= Fetch Dashboard Data ================= */
  const loadData = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const [usersRes, projectsRes] = await Promise.all([
        axios.get(`/api/invite/team/active/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get("/api/project", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const team = usersRes.data || [];
      setAllUsers(team);

      const usersWithCurrent = [
        ...team,
        { _id: user._id, fullName: user.fullName },
      ];

      const projectsData = projectsRes.data
        ?.map((proj) => {
          const updatedMembers = proj.members?.map((id) => {
            const member = usersWithCurrent.find((u) => u._id === id);
            if (member) return member.fullName;
            const isObjectId = /^[a-f\d]{24}$/i.test(id);
            return isObjectId ? "Unknown User" : id;
          });
          return { ...proj, members: updatedMembers || [] };
        })
        ?.filter((proj) => proj.members?.includes(user?.fullName));

      setProjects(projectsData || []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?._id]);

  /* ================= Add Project ================= */
  const addProjectToList = (project) => {
    const usersWithCurrent = [
      ...allUsers,
      { _id: user._id, fullName: user.fullName },
    ];
    const resolvedMembers = project.members?.map((id) => {
      const member = usersWithCurrent.find((u) => u._id === id);
      if (member) return member.fullName;
      const isObjectId = /^[a-f\d]{24}$/i.test(id);
      return isObjectId ? "Unknown User" : id;
    }) || [];
    setProjects((prev) => [{ ...project, members: resolvedMembers }, ...prev]);
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

      // Resolve member IDs to names locally for instant display
      const usersWithCurrent = [
        ...allUsers,
        { _id: user._id, fullName: user.fullName },
      ];
      const resolvedMembers = (updatedData.members || []).map((id) => {
        const member = usersWithCurrent.find((u) => u._id === id);
        if (member) return member.fullName;
        const isObjectId = /^[a-f\d]{24}$/i.test(id);
        return isObjectId ? "Unknown User" : id;
      });

      setProjects((prev) =>
        prev.map((p) =>
          p._id === editingProject._id
            ? { ...p, ...updatedData, members: resolvedMembers, status: updatedData.status || p.status }
            : p
        )
      );
      setEditingProject(null);
    } catch (err) {
      console.error("Failed to edit project:", err.message);
      alert("Failed to save changes.");
    }
  };

  return (
    <div className="flex h-screen bg-background text-text-primary">
      {/* ===== Sidebar ===== */}
      <DashboardLeftSide />

      {/* ===== Main Content ===== */}
      <div className="flex-1 h-screen overflow-y-auto px-5 py-6">
        <div className="max-w-[1400px] w-full mx-auto">
          {/* Top Header */}
          <DashboardHeader user={user} />

          {/* ===== Page Title Section ===== */}
          <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-text-primary">Projects</h1>
              <p className="text-text-secondary text-xs sm:text-sm mt-1 sm:mt-2">
                Manage and track your team's development lifecycle.
                {!loading && projects.length > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
                    {projects.length} project{projects.length !== 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white transition px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-md text-sm sm:text-base font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Project
            </button>
          </div>

          {/* ===== Projects Grid ===== */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-[260px] ">
            {loading ? (
              /* ── Skeleton Loaders ── */
              Array.from({ length: 6 }).map((_, i) => (
                <ProjectCardSkeleton key={i} />
              ))
            ) : projects.length > 0 ? (
              <>
                {projects.map((proj) => (
                  <ProjectCard
                    key={proj._id}
                    project={proj}
                    onClick={() => navigate(`/project/${proj._id}`)}
                    onEdit={(e) => { e.stopPropagation(); setEditingProject(proj); }}
                    onDelete={(e) => handleDelete(proj._id, e)}
                  />
                ))}
                {/* ===== New Project Card ===== */}
                <div
                  onClick={() => setIsModalOpen(true)}
                  className="border border-dashed border-border-strong rounded-2xl flex flex-col items-center justify-center min-h-[260px] bg-surface hover:border-primary hover:bg-primary/5 transition cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-hover-bg group-hover:bg-primary/10 rounded-full flex items-center justify-center mb-3 text-text-muted group-hover:text-primary transition">
                    <Plus className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-text-primary text-sm">Start New Project</p>
                  <p className="text-text-muted text-xs mt-1">Templates available</p>
                </div>
              </>
            ) : (
              /* ── Premium Empty State ── */
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <EmptyState
                  icon={<Folder size={22} />}
                  title="No Projects Found"
                  description="Create your first project to start collaborating with your team, tracking progress, and shipping faster."
                  action={{ label: "Create Project", onClick: () => setIsModalOpen(true) }}
                  minHeight="min-h-[380px]"
                />
              </div>
            )}
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

    </div>
  );
}

/* ================= Project Card Skeleton ================= */
function ProjectCardSkeleton() {
  return (
    <div className="bg-card border border-border-subtle rounded-2xl p-4 min-h-[260px] flex flex-col animate-pulse">
      {/* Header row: icon + title */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-surface shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-surface rounded-md w-3/4" />
          <div className="h-3 bg-surface rounded-md w-1/3" />
        </div>
        {/* action button placeholders */}
        <div className="flex gap-2 ml-auto shrink-0">
          <div className="w-4 h-4 rounded bg-surface" />
          <div className="w-4 h-4 rounded bg-surface" />
        </div>
      </div>

      {/* Description lines */}
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-surface rounded-md w-full" />
        <div className="h-3 bg-surface rounded-md w-5/6" />
      </div>

      {/* GitHub stats row */}
      <div className="flex items-center gap-4 mb-4">
        <div className="h-3 bg-surface rounded-md w-12" />
        <div className="h-3 bg-surface rounded-md w-12" />
      </div>

      {/* Members section pushed to bottom */}
      <div className="mt-auto">
        <div className="h-3 bg-surface rounded-md w-14 mb-2" />
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-20 bg-surface rounded-full" />
          <div className="h-6 w-16 bg-surface rounded-full" />
          <div className="h-6 w-24 bg-surface rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ================= Project Card ================= */
function ProjectCard({ project, onClick, onEdit, onDelete }) {

  const { projectName, description, members, githubData, visibility } = project;

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border-subtle rounded-2xl p-4 hover:border-primary/50 transition relative cursor-pointer hover:-translate-y-1 duration-200 shadow-sm hover:shadow-md"
    >
      {/* Edit & Delete Buttons */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={onEdit}
          title="Edit project"
          className="text-text-muted hover:text-primary transition"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={onDelete}
          title="Delete project"
          className="text-text-muted hover:text-error transition"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="bg-primary-soft p-3 rounded-xl">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">{projectName}</h3>
          <p className="text-xs text-text-muted">{visibility}</p>
        </div>
      </div>

      <p className="text-sm text-text-secondary mb-4 line-clamp-2">{description}</p>

      {/* GitHub Info */}
      {githubData && (
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2 text-text-secondary text-xs">
            <Star className="w-4 h-4 text-warning" />
            {githubData.stars}
          </div>
          <div className="flex items-center gap-2 text-text-secondary text-xs">
            <GitBranch className="w-4 h-4 text-info" />
            {githubData.forks}
          </div>
        </div>
      )}

      {/* Members - pushed to bottom */}
      <div className="mt-auto">
        <div className="text-xs text-text-muted ml-1 mb-2 font-medium">Members</div>
        <div className="flex flex-wrap gap-2 overflow-hidden max-h-[52px]">
          {members?.map((mem, i) => (
            <span
              key={i}
              className="text-xs bg-surface px-2.5 py-1 rounded-full text-text-secondary border border-border-subtle font-medium"
            >
              {typeof mem === "object" ? mem.fullName : mem}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= Edit Project Modal ================= */
function EditProjectModal({ project, allUsers, currentUserId, onClose, onSave }) {
  const [name, setName] = useState(project.projectName || "");
  const [desc, setDesc] = useState(project.description || "");

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border-default rounded-xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-[500px] max-h-[90vh] overflow-y-auto shadow-popover">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-border-subtle pb-4">
          <h2 className="text-lg font-semibold text-text-primary">Edit Project</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition p-1 rounded-md"
          >
            &times;
          </button>
        </div>

        {/* Project Name */}
        <div className="mb-4">
          <label className="text-sm font-medium text-text-secondary block mb-1">
            Project Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter project name"
            className="w-full px-3 py-2 bg-input-bg border border-border-default rounded-lg outline-none text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="text-sm font-medium text-text-secondary block mb-1">
            Description
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            placeholder="Describe your project..."
            className="w-full px-3 py-2 bg-input-bg border border-border-default rounded-lg outline-none text-sm text-text-primary placeholder:text-text-muted resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
          />
        </div>

        {/* Members */}
        <div className="mb-6">
          <label className="text-sm font-medium text-text-secondary block mb-2">
            Team Members
          </label>

          {allUsers.length === 0 ? (
            <p className="text-xs text-text-muted bg-surface p-3 rounded-lg">No team members available.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
              {allUsers.map((u) => {
                const isCurrentUser = u._id === currentUserId;
                const isChecked = selectedIds.includes(u._id);

                return (
                  <label
                    key={u._id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition cursor-pointer ${isChecked
                      ? "border-primary/50 bg-primary-soft/50"
                      : "border-border-default bg-surface hover:border-border-strong"
                      } ${isCurrentUser ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isCurrentUser}
                      onChange={() => toggleMember(u._id)}
                      className="accent-primary w-4 h-4"
                    />
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {u.fullName}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs font-normal text-text-muted">(you)</span>
                        )}
                      </p>
                      {u.email && (
                        <p className="text-xs text-text-secondary mt-0.5">{u.email}</p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {/* Selected count */}
          <p className="text-xs font-medium text-text-secondary mt-3">
            {selectedIds.length} member{selectedIds.length !== 1 ? "s" : ""} selected
          </p>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle mt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-hover-bg rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 bg-primary hover:bg-primary-hover text-white transition rounded-xl text-sm font-medium shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>

  );

}