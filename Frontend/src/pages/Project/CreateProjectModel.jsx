import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import axios from "axios";

export default function CreateProjectModal({ onClose, addProjectToList }) {
  const authUser = JSON.parse(localStorage.getItem("ChatApp"));
  const currentUser = authUser?.user;
  const currentUserId = currentUser?._id;

  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [team, setTeam] = useState("Engineering Team");
  const [visibility, setVisibility] = useState("Private (Team only)");

  const [allUsers, setAllUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");

  const [githubConnected, setGithubConnected] = useState(true);
  const [repoURL, setRepoURL] = useState("");
  const [githubToken, setGithubToken] = useState(""); // ✅ new

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* ================= Fetch Active Team ================= */
  useEffect(() => {
    const fetchActiveTeam = async () => {
      try {
        const res = await axios.get(
          `/api/invite/team/active/${currentUserId}`
        );
        const uniqueUsers = Array.from(new Map((res.data || []).map(user => [user._id, user])).values());
        setAllUsers(uniqueUsers);
      } catch (err) {
        console.error("Failed to fetch active team:", err);
      }
    };

    if (currentUserId) fetchActiveTeam();
  }, [currentUserId]);

  /* ================= Add Member ================= */
  const handleAddMember = () => {
    if (!selectedUser) return;
    const userObj = allUsers.find((u) => u._id === selectedUser);
    if (!userObj) return;
    if (!members.some((m) => m._id === userObj._id)) {
      setMembers([...members, userObj]);
    }
    setSelectedUser("");
  };

  /* ================= Remove Member ================= */
  const handleRemoveMember = (id) => {
    setMembers(members.filter((m) => m._id !== id));
  };

  /* ================= Create Project ================= */
  const handleCreate = async () => {
    if (!projectName.trim()) {
      setError("Project name is required");
      return;
    }

    // ✅ Warn if private repo token is missing
    if (githubConnected && repoURL && !githubToken) {
      setError("Please provide a GitHub token for private repositories.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await axios.post("/api/project", {
        projectName,
        description,
        team,
        visibility,
        members: [currentUserId, ...members.map((m) => m._id)],
        githubRepo: githubConnected ? repoURL : null,
        githubToken: githubConnected ? githubToken : null, // ✅ send token
      });

      if (addProjectToList) {
        addProjectToList(res.data);
      }

      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }

    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-card w-full max-w-[600px] rounded-2xl p-5 sm:p-8 shadow-popover text-text-primary border border-border-default relative max-h-[90vh] overflow-y-auto">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-text-muted hover:text-text-primary transition"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-semibold mb-2">Create New Project</h2>
        <p className="text-sm text-text-secondary mb-6">
          Set up your workspace and invite your team to start building.
        </p>

        {error && <p className="text-error text-sm mb-4">{error}</p>}

        {/* Project Name */}
        <label className="text-sm font-medium text-text-secondary">Project Name</label>
        <input
          type="text"
          placeholder="e.g. Apollo Engine"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-full mt-1 mb-4 px-4 py-2 bg-input-bg rounded-lg border border-border-default focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-text-primary placeholder:text-text-muted transition"
        />

        {/* Description */}
        <label className="text-sm font-medium text-text-secondary">Description</label>
        <textarea
          placeholder="Describe the project goals and scope..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full mt-1 mb-4 px-4 py-2 bg-input-bg rounded-lg border border-border-default focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-text-primary placeholder:text-text-muted transition"
        />

        {/* Assign Members */}
        <label className="text-sm font-medium text-text-secondary">Assign Members</label>
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="flex-1 py-2 px-4 bg-input-bg rounded-lg border border-border-default text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">Select team member</option>
            {allUsers.map((user) => (
              <option key={user._id} value={user._id}>
                {user.fullName}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddMember}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition w-full sm:w-auto"
          >
            Add
          </button>
        </div>


        {/* Member Chips */}
        <div className="flex flex-wrap gap-2 mt-4 mb-6">
          {members.map((member) => (
            <div
              key={member._id}
              className="flex items-center gap-2 bg-surface border border-border-subtle px-3 py-1 rounded-full text-sm text-text-primary"
            >
              {member.fullName}
              <button
                onClick={() => handleRemoveMember(member._id)}
                className="text-error hover:text-error-hover transition"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* GitHub Card */}
        <div className="bg-surface border border-border-subtle rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FaGithub size={20} className="text-text-primary" />
              <div>
                <p className="font-medium text-text-primary">Connect GitHub Repository</p>
                <p className="text-xs text-text-muted">
                  Sync issues, pull requests and commits.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={githubConnected}
              onChange={(e) => setGithubConnected(e.target.checked)}
              className="accent-primary"
            />
          </div>

          {githubConnected && (
            <div className="mt-4 flex flex-col gap-3">
              {/* Repo URL */}
              <input
                type="text"
                placeholder="github.com/username/repository"
                value={repoURL}
                onChange={(e) => setRepoURL(e.target.value)}
                className="w-full px-4 py-2 bg-input-bg rounded-lg border border-border-default outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary placeholder:text-text-muted transition"
              />

              {/* ✅ GitHub Token */}
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">
                  GitHub Personal Access Token{" "}
                  <span className="text-text-muted">(required for private repos)</span>
                </label>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="w-full px-4 py-2 bg-input-bg rounded-lg border border-border-default outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary placeholder:text-text-muted transition"
                />
                <p className="text-xs text-text-muted mt-1">
                  Generate at{" "}
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    github.com/settings/tokens
                  </a>{" "}
                  with <span className="text-text-secondary font-medium">repo</span> scope.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pt-4">
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition font-medium w-full sm:w-auto text-center">
            Cancel
          </button>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button className="px-4 py-2 bg-surface border border-border-default text-text-primary rounded-lg hover:bg-hover-bg transition w-full sm:w-auto">
              Save as Draft
            </button>
            <button
              disabled={saving}
              onClick={handleCreate}
              className={`px-6 py-2 rounded-lg text-white font-medium transition w-full sm:w-auto ${saving
                ? "bg-text-muted cursor-not-allowed"
                : "bg-primary hover:bg-primary-hover shadow-sm"
                }`}
            >
              {saving ? "Creating..." : "Create Project"}
            </button>
          </div>
        </div>
      </div>
    </div>

  );
}