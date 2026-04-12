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
          `http://localhost:3001/api/invite/team/active/${currentUserId}`
        );
        setAllUsers(res.data || []);
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
      const res = await axios.post("http://localhost:3001/api/project", {
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-[#0B1120] w-[600px] rounded-2xl p-8 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-semibold mb-2">Create New Project</h2>
        <p className="text-sm text-gray-400 mb-6">
          Set up your workspace and invite your team to start building.
        </p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* Project Name */}
        <label className="text-sm text-gray-300">Project Name</label>
        <input
          type="text"
          placeholder="e.g. Apollo Engine"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-full mt-1 mb-4 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        {/* Description */}
        <label className="text-sm text-gray-300">Description</label>
        <textarea
          placeholder="Describe the project goals and scope..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full mt-1 mb-4 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        {/* Assign Members */}
        <label className="text-sm text-gray-300">Assign Members</label>
        <div className="flex gap-2 mt-2">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="flex-1 px-4 bg-gray-800 rounded-lg border border-gray-700"
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
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>

        {/* Member Chips */}
        <div className="flex flex-wrap gap-2 mt-4 mb-6">
          {members.map((member) => (
            <div
              key={member._id}
              className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full text-sm"
            >
              {member.fullName}
              <button
                onClick={() => handleRemoveMember(member._id)}
                className="text-red-400 hover:text-red-500"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* GitHub Card */}
        <div className="bg-[#111827] border border-gray-700 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FaGithub size={20} />
              <div>
                <p className="font-medium">Connect GitHub Repository</p>
                <p className="text-xs text-gray-400">
                  Sync issues, pull requests and commits.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={githubConnected}
              onChange={(e) => setGithubConnected(e.target.checked)}
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
                className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* ✅ GitHub Token */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  GitHub Personal Access Token{" "}
                  <span className="text-gray-500">(required for private repos)</span>
                </label>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Generate at{" "}
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    github.com/settings/tokens
                  </a>{" "}
                  with <span className="text-gray-400">repo</span> scope.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-between items-center">
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            Cancel
          </button>

          <div className="flex gap-3">
            <button className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
              Save as Draft
            </button>
            <button
              disabled={saving}
              onClick={handleCreate}
              className={`px-6 py-2 rounded-lg ${
                saving
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
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