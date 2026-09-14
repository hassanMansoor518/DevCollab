const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const os = require("os");
const { exec: execCmd } = require("child_process");
const Project = require("../model/project.model");
const Workspace = require("../model/workspace.model");
const Analysis = require("../model/analysis.model");
const PullRequest = require("../model/pullRequest.model");
const User = require("../model/user.model");
const ai = require("../services/ai.service");
const { logActivity } = require("../services/activity.service");
const workspaceFs = require("../services/workspaceFs.service");
const terminalManager = require("../services/TerminalManager");
require("dotenv").config();

const router = express.Router();
const protectRoute = require("../middleware/secureRoute");
const jwt = require("jsonwebtoken");

/* ─── GitHub Token (resolved once from environment on startup) ─── */
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || null;

/* ================= GLOBAL HELPER ================= */
const formatRepo = (url, project = null) => {
  if (!url) {
    if (project?.githubData?.html_url) {
      return formatRepo(project.githubData.html_url);
    }
    return null;
  }
  let clean = url
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/^http:\/\/github\.com\//, "")
    .replace(/^github\.com\//, "")
    .replace(/\.git$/, "")
    .trim();

  // If repo is just a single name without owner (e.g. "StudentFeedback"), try to extract owner from githubData
  if (!clean.includes("/") && project?.githubData?.html_url) {
    const fromHtml = formatRepo(project.githubData.html_url);
    if (fromHtml && fromHtml.includes("/")) {
      return fromHtml;
    }
  }
  return clean;
};

const getOptionalUserToken = async (req, project = null) => {
  try {
    if (req?.user?.githubAccessToken) return req.user.githubAccessToken;
    const headerToken = req?.headers?.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;
    const token = req?.cookies?.token || headerToken || req?.query?.userToken;
    if (token) {
      const JWT_SECRET = process.env.JWT_SECRET || "e972d971df9c5e979d26b7767950a8b5";
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id || decoded.userId || decoded._id;
      if (userId) {
        const u = await User.findById(userId).select("githubAccessToken");
        if (u?.githubAccessToken) return u.githubAccessToken;
      }
    }

    // Check project members for a valid GitHub token
    if (project?.members && project.members.length > 0) {
      const memberUsers = await User.find({
        _id: { $in: project.members },
        githubAccessToken: { $exists: true, $ne: null, $ne: "" },
      }).select("githubAccessToken");
      if (memberUsers.length > 0 && memberUsers[0].githubAccessToken) {
        return memberUsers[0].githubAccessToken;
      }
    }
  } catch (_) {}
  return process.env.GITHUB_TOKEN || null;
};

const getGithubHeaders = (userToken = null) => {
  const token = userToken || process.env.GITHUB_TOKEN;
  if (!token) return { "User-Agent": "DevCollab-App" };
  const authVal = token.startsWith("ghp_") || token.startsWith("github_pat_") || token.startsWith("gho_")
    ? `token ${token}`
    : `Bearer ${token}`;
  return {
    Authorization: authVal,
    "User-Agent": "DevCollab-App",
  };
};

const githubApiRequest = async (url, options = {}) => {
  const userToken = options.userToken || null;
  const headers = {
    ...getGithubHeaders(userToken),
    Accept: options.accept || "application/vnd.github.v3+json",
    ...(options.headers || {}),
  };

  try {
    const res = await axios.get(url, { ...options, headers, timeout: options.timeout || 15000 });
    return res;
  } catch (err) {
    if ((err.response?.status === 401 || err.response?.status === 403) && headers.Authorization) {
      console.warn(`[GitHub API] Auth warning (${err.response?.status}) for ${url}, attempting unauthenticated fallback...`);
      const publicHeaders = {
        "User-Agent": "DevCollab-App",
        Accept: options.accept || "application/vnd.github.v3+json",
      };
      return await axios.get(url, { ...options, headers: publicHeaders, timeout: options.timeout || 15000 });
    }
    throw err;
  }
};

/* ================= Fetch GitHub Data ================= */
async function fetchGithubData(repo, userToken = null) {
  try {
    if (!repo) return null;
    const cleanRepo = formatRepo(repo);
    if (!cleanRepo) return null;

    const [repoRes, langRes] = await Promise.all([
      githubApiRequest(`https://api.github.com/repos/${cleanRepo}`, { userToken }),
      githubApiRequest(`https://api.github.com/repos/${cleanRepo}/languages`, { userToken }).catch(() => ({ data: {} })),
    ]);

    return {
      html_url: repoRes.data.html_url,
      description: repoRes.data.description || "",
      stars: repoRes.data.stargazers_count || 0,
      forks: repoRes.data.forks_count || 0,
      languages: Object.keys(langRes.data || {}),
      default_branch: repoRes.data.default_branch || "main",
      private: Boolean(repoRes.data.private),
    };
  } catch (err) {
    console.error("GitHub fetch failed for repo", repo, ":", err.response?.data || err.message);
    return null;
  }
}

/* ================= CREATE PROJECT → auto-creates Workspace ================= */
router.post("/", async (req, res) => {
  try {
    console.log("Incoming Body:", req.body);

    const { projectName, description, team, visibility, members, githubRepo } = req.body;
    const cleanMembers = Array.isArray(members) ? members.filter(Boolean) : [];
    const creatorId = cleanMembers[0];

    if (!projectName) {
      return res.status(400).json({ error: "Project name is required" });
    }

    const cleanRepo = formatRepo(githubRepo);
    let githubData = null;
    if (cleanRepo && GITHUB_TOKEN) {
      githubData = await fetchGithubData(cleanRepo);
    }

    // ✅ Step 1: Create project
    const newProject = await Project.create({
      projectName,
      description,
      team,
      visibility,
      members: cleanMembers,
      githubRepo: cleanRepo,
      githubData,
    });

    console.log("PROJECT CREATED:", newProject);

    // ✅ Step 2: Auto-create linked Workspace
    try {
      const workspace = await Workspace.create({
        name: projectName + " Workspace",
        projectId: newProject._id,
        members: newProject.members,
        admins: creatorId ? [creatorId] : newProject.members.slice(0, 1),
      });

      newProject.workspace = workspace._id;
      await newProject.save();

      console.log("WORKSPACE CREATED:", workspace);

      // Log Activity: PROJECT_CREATED
      await logActivity({
        type: "PROJECT_CREATED",
        title: "New Project Created",
        description: `Project '${projectName}' has been successfully initialized.`,
        metadata: { projectId: newProject._id }
      });
    } catch (err) {
      console.error("Workspace creation error:", err.message);
    }

    res.status(201).json(newProject);
  } catch (err) {
    console.error("Create Project Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= ADD MEMBER → auto-syncs Workspace ================= */
router.post("/:id/members", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // ✅ Step 1: Find project
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    // ✅ Step 2: Check duplicate in project
    const alreadyInProject = project.members
      .map((m) => m.toString())
      .includes(userId.toString());

    if (!alreadyInProject) {
      project.members.push(userId);
      await project.save();
      console.log("MEMBER ADDED TO PROJECT:", userId);
    }

    // ✅ Step 3: Sync to linked Workspace
    const workspace = await Workspace.findOne({ projectId: project._id });

    if (workspace) {
      const alreadyInWorkspace = workspace.members
        .map((m) => m.toString())
        .includes(userId.toString());

      if (!alreadyInWorkspace) {
        workspace.members.push(userId);
        await workspace.save();
        console.log("MEMBER SYNCED TO WORKSPACE:", userId);
      }
    } else {
      console.warn("No workspace found for project:", project._id);
    }

    // Log Activity: TEAM_MEMBER_ADDED
    await logActivity({
      type: "TEAM_MEMBER_ADDED",
      title: "Team Member Added",
      description: `A new member has been added to project '${project.projectName}'.`,
      metadata: { projectId: project._id, userId }
    });

    res.json({ message: "Member added to project and workspace", project });
  } catch (err) {
    console.error("Add Member Error:", err.message);
    res.status(500).json({ error: "Failed to add member" });
  }
});

/* ================= FETCH COMMITS ================= */
router.get("/:id/commits", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (!project.githubRepo) {
      // No GitHub repo linked — return structured empty state
      return res.json({ commits: [], hasRepo: false, noCommits: true });
    }

    const repo = formatRepo(project.githubRepo);
    const branch = req.query.branch || null;
    let allCommits = [];
    let page = 1;
    let hasMore = true;

    try {
      while (hasMore) {
        const branchParam = branch ? `&sha=${encodeURIComponent(branch)}` : "";
        const response = await axios.get(
          `https://api.github.com/repos/${repo}/commits?per_page=100&page=${page}${branchParam}`,
          { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
        );

        const commits = response.data;
        if (commits.length === 0) {
          hasMore = false;
        } else {
          allCommits = [...allCommits, ...commits];
          page++;
          // Cap at 500 commits to avoid timeout
          if (allCommits.length >= 500) hasMore = false;
        }
      }
    } catch (ghErr) {
      // GitHub API error — repo might be empty
      if (ghErr.response?.status === 409 || ghErr.response?.status === 404) {
        return res.json({ commits: [], hasRepo: true, noCommits: true });
      }
      throw ghErr;
    }

    const formattedCommits = allCommits.map((c) => ({
      sha: c.sha,
      message: c.commit.message,
      author: c.commit.author.name,
      authorEmail: c.commit.author.email,
      authorAvatar: c.author?.avatar_url || null,
      date: c.commit.author.date,
      url: c.html_url,
    }));

    res.json({
      commits: formattedCommits,
      hasRepo: true,
      noCommits: formattedCommits.length === 0,
    });
  } catch (err) {
    console.error("Commits Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch commits", hasRepo: true, noCommits: false });
  }
});

/* ================= FETCH FILES / CONTENT ================= */
router.get("/:id/contents", async (req, res) => {
  try {
    const { path: reqPath = "", branch: queryBranch = "", refresh = "false" } = req.query;
    const project = await Project.findById(req.params.id);

    if (!project || !project.githubRepo) {
      return res.status(400).json({ error: "No GitHub repo linked to this project" });
    }

    const cleanRepo = formatRepo(project.githubRepo, project);
    const userToken = await getOptionalUserToken(req, project);

    // If file is already cached on workspace disk and not a forced refresh, check disk first
    if (reqPath && refresh !== "true") {
      const diskContent = workspaceFs.readWorkspaceFile(req.params.id, reqPath);
      if (diskContent !== null) {
        return res.json({
          type: "file",
          name: reqPath.split("/").pop(),
          path: reqPath,
          content: diskContent,
          source: "workspace"
        });
      }
    }

    // Determine target branch
    const branch = queryBranch || project.githubData?.default_branch || "main";
    const cleanPath = reqPath.replace(/^\/+/, "");
    const encodedPath = cleanPath ? encodeURIComponent(cleanPath).replace(/%2F/g, "/") : "";
    const url = `https://api.github.com/repos/${cleanRepo}/contents/${encodedPath}${branch ? `?ref=${encodeURIComponent(branch)}` : ""}`;

    let response;
    try {
      response = await githubApiRequest(url, { userToken });
    } catch (apiErr) {
      // If 404 and we have a path, try fetching raw content
      if (cleanPath) {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${cleanRepo}/${branch}/${cleanPath}`;
          const rawRes = await axios.get(rawUrl, {
            headers: userToken ? { Authorization: userToken.startsWith("ghp_") ? `token ${userToken}` : `Bearer ${userToken}` } : {},
            responseType: "text",
            timeout: 15000
          });
          const rawContent = typeof rawRes.data === "string" ? rawRes.data : JSON.stringify(rawRes.data, null, 2);
          try {
            workspaceFs.writeWorkspaceFile(req.params.id, cleanPath, rawContent);
          } catch (_) {}
          return res.json({
            type: "file",
            name: cleanPath.split("/").pop(),
            path: cleanPath,
            content: rawContent,
            source: "github-raw"
          });
        } catch (_) {}
      }
      throw apiErr;
    }

    // 📁 Folder
    if (Array.isArray(response.data)) {
      return res.json({
        type: "folder",
        items: response.data.map((item) => ({
          name: item.name,
          path: item.path,
          type: item.type === "dir" ? "dir" : "file",
          size: item.size || 0
        })),
        source: "github"
      });
    }

    // 📄 File
    let content = "";
    if (response.data.content) {
      const cleanBase64 = response.data.content.replace(/\s/g, "");
      content = Buffer.from(cleanBase64, "base64").toString("utf-8");
    } else if (response.data.download_url) {
      // Large file with download_url
      try {
        const dlRes = await axios.get(response.data.download_url, { responseType: "text", timeout: 15000 });
        content = dlRes.data;
      } catch (_) {
        content = "";
      }
    }

    // Cache file to local workspace disk
    if (cleanPath) {
      try {
        workspaceFs.writeWorkspaceFile(req.params.id, cleanPath, content);
      } catch (_) {}
    }

    res.json({
      type: "file",
      name: response.data.name || cleanPath.split("/").pop(),
      path: cleanPath,
      content,
      sha: response.data.sha,
      source: "github"
    });
  } catch (err) {
    console.error("Contents Error:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: "Failed to fetch file content from GitHub repository",
      details: err.response?.data?.message || err.message
    });
  }
});

/* ================= ANALYZE COMMIT ================= */
router.get("/:id/commit/:sha/analyze", async (req, res) => {
  try {
    const { id, sha } = req.params;
    const project = await Project.findById(id);

    if (!project || !project.githubRepo) {
      return res.status(400).json({ error: "No GitHub repo linked" });
    }

    const repo = formatRepo(project.githubRepo);

    const commitRes = await axios.get(
      `https://api.github.com/repos/${repo}/commits/${sha}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );

    const commitData = commitRes.data;
    const patchData = commitData.files
      .map((file) => `File: ${file.filename}\n${file.patch || ""}`)
      .join("\n\n");

    const analysisResult = await ai.analyzeCommit({
      message: commitData.commit.message,
      patch: patchData,
    });

    await Analysis.create({ projectId: id, commitSha: sha, result: analysisResult });

    res.json({ analysis: analysisResult });
  } catch (err) {
    console.error("Analyze Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to analyze commit" });
  }
});

/* ================= GET ALL PROJECTS (Filtered by user) ================= */
router.get("/", protectRoute, async (req, res) => {
  try {
    const userId = req.user._id;
    const fullName = req.user.fullName;

    // Use raw collection to avoid Mongoose CastError on 'members' field
    // which is defined as ObjectId in the schema but contains names in legacy data.
    const projects = await Project.collection.find({
      $or: [
        { members: userId },
        { members: fullName }
      ]
    }).toArray();

    res.json(projects);
  } catch (err) {
    console.error("Fetch Projects Error:", err.message);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

/* ================= GET SINGLE PROJECT ================= */
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err) {
    console.error("Fetch Project Error:", err.message);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

/* ================= UPDATE FILE ================= */
router.put("/:id/update-file", async (req, res) => {
  try {
    const { path, content, message } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project || !project.githubRepo) {
      return res.status(400).json({ error: "No GitHub repo linked" });
    }

    const repo = formatRepo(project.githubRepo);

    const fileRes = await axios.get(
      `https://api.github.com/repos/${repo}/contents/${path}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );

    const sha = fileRes.data.sha;

    const updateRes = await axios.put(
      `https://api.github.com/repos/${repo}/contents/${path}`,
      {
        message: message || "Updated from DevCollab",
        content: Buffer.from(content).toString("base64"),
        sha,
      },
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );

    res.json({ success: true, data: updateRes.data });
  } catch (err) {
    console.error("Update File Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to update file" });
  }
});

/* ================= CREATE FILE ================= */
router.post("/:id/create-file", async (req, res) => {
  try {
    const { path, content, message } = req.body;
    const project = await Project.findById(req.params.id);
    const repo = formatRepo(project.githubRepo);

    const response = await axios.put(
      `https://api.github.com/repos/${repo}/contents/${path}`,
      {
        message: message || "Created new file from DevCollab",
        content: Buffer.from(content || "").toString("base64"),
      },
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );

    res.json({ success: true, data: response.data });
  } catch (err) {
    console.error("Create File Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to create file" });
  }
});

/* ================= DELETE FILE ================= */
router.delete("/:id/delete-file", async (req, res) => {
  try {
    const { path, message } = req.body;
    const project = await Project.findById(req.params.id);
    const repo = formatRepo(project.githubRepo);

    const fileRes = await axios.get(
      `https://api.github.com/repos/${repo}/contents/${path}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );

    const sha = fileRes.data.sha;

    await axios.delete(
      `https://api.github.com/repos/${repo}/contents/${path}`,
      {
        data: { message: message || "Deleted from DevCollab", sha },
        headers: { Authorization: `token ${GITHUB_TOKEN}` },
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Delete File Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

/* ================= GET PROJECT MEMBERS (Populated) ================= */
router.get("/:id/members", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "members",
      "fullName email avatar bio provider createdAt"
    );
    if (!project) return res.status(404).json({ error: "Project not found" });

    const creatorId = project.members?.[0]?._id?.toString();
    const membersWithRole = (project.members || []).map((m, idx) => ({
      _id: m._id,
      fullName: m.fullName,
      email: m.email,
      avatar: m.avatar || null,
      bio: m.bio || "",
      provider: m.provider || "local",
      joinedAt: m.createdAt,
      role: idx === 0 ? "Owner" : "Contributor",
    }));

    res.json({ members: membersWithRole, total: membersWithRole.length });
  } catch (err) {
    console.error("Get Members Error:", err.message);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

/* ================= REMOVE MEMBER FROM PROJECT ================= */
router.delete("/:id/members/:userId", async (req, res) => {
  try {
    const { id, userId } = req.params;

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Prevent removing the owner (first member)
    const ownerIdStr = project.members?.[0]?.toString();
    if (ownerIdStr === userId) {
      return res.status(403).json({ error: "Cannot remove the project owner" });
    }

    // Remove from project
    project.members = project.members.filter((m) => m.toString() !== userId);
    await project.save();

    // Sync removal to linked workspace
    const workspace = await Workspace.findOne({ projectId: project._id });
    if (workspace) {
      workspace.members = workspace.members.filter((m) => m.toString() !== userId);
      await workspace.save();
    }

    await logActivity({
      type: "TEAM_MEMBER_REMOVED",
      title: "Team Member Removed",
      description: `A member was removed from project '${project.projectName}'.`,
      metadata: { projectId: project._id, userId },
    });

    res.json({ success: true, message: "Member removed" });
  } catch (err) {
    console.error("Remove Member Error:", err.message);
    res.status(500).json({ error: "Failed to remove member" });
  }
});

/* ================= FETCH GITHUB BRANCHES ================= */
router.get("/:id/branches", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project || !project.githubRepo) {
      return res.json({ branches: ["main"], default: "main" });
    }

    const repo = formatRepo(project.githubRepo);
    const authHeader = GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};

    try {
      const response = await axios.get(
        `https://api.github.com/repos/${repo}/branches?per_page=100`,
        { headers: authHeader, timeout: 10000 }
      );
      const branches = response.data.map((b) => b.name);
      const defaultBranch = project.githubData?.default_branch || "main";
      res.json({ branches, default: defaultBranch });
    } catch (_) {
      res.json({ branches: ["main", "develop"], default: "main" });
    }
  } catch (err) {
    console.error("Branches Error:", err.message);
    res.json({ branches: ["main"], default: "main" });
  }
});

/* ================= EDIT PROJECT ================= */
router.put("/:id", async (req, res) => {
  try {
    const { projectName, description, members } = req.body;

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      {
        ...(projectName && { projectName }),
        ...(description !== undefined && { description }),
        ...(members && {
          members: Array.isArray(members) ? members.filter(Boolean) : [],
        }),
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Project not found" });

    // Log Activity: PROJECT_UPDATED
    await logActivity({
      type: "PROJECT_UPDATED",
      title: "Project Settings Updated",
      description: `The settings for project '${updated.projectName}' have been modified.`,
      metadata: { projectId: updated._id }
    });

    res.json(updated);
  } catch (err) {
    console.error("Edit Project Error:", err.message);
    res.status(500).json({ error: "Failed to update project" });
  }
});

/* ================= DELETE PROJECT → auto-deletes Workspace ================= */
router.delete("/:id", async (req, res) => {
  try {
    // ✅ Step 1: Delete project
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Project not found" });

    // ✅ Step 2: Auto-delete linked Workspace
    const deletedWorkspace = await Workspace.findOneAndDelete({
      projectId: deleted._id,
    });

    if (deletedWorkspace) {
      console.log("WORKSPACE DELETED:", deletedWorkspace._id);
    } else {
      console.warn("No workspace found to delete for project:", deleted._id);
    }

    // Log Activity: PROJECT_DELETED
    await logActivity({
      type: "PROJECT_DELETED",
      title: "Project Deleted",
      description: `Project '${deleted.projectName}' and its workspace have been removed.`,
      metadata: { projectId: deleted._id }
    });

    res.json({ success: true, message: "Project and workspace deleted" });
  } catch (err) {
    console.error("Delete Project Error:", err.message);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

/* ================= INDEX REPOSITORY ================= */
router.post("/:id/index", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project || !project.githubRepo) {
      return res.status(400).json({ error: "No GitHub repo linked" });
    }

    const repo = formatRepo(project.githubRepo);

    // 1. Fetch Repository Tree (Recursive)
    // We'll use the main/master branch. Typically 'main' or 'master'
    // First, get the default branch if possible, but let's assume 'main' or 'master' for now
    // Actually, we can get the default branch from githubData if we have it
    const defaultBranch = project.githubData?.default_branch || "main";

    let treeRes;
    try {
      treeRes = await axios.get(
        `https://api.github.com/repos/${repo}/git/trees/${defaultBranch}?recursive=1`,
        { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
      );
    } catch (err) {
      // Fallback to master if main fails
      treeRes = await axios.get(
        `https://api.github.com/repos/${repo}/git/trees/master?recursive=1`,
        { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
      );
    }

    const fullTree = treeRes.data.tree;

    // 2. Filter tree (exclude node_modules, .git, etc.)
    const ignoredPatterns = [
      "node_modules/",
      ".git/",
      "dist/",
      "build/",
      ".next/",
      ".cache/",
      "package-lock.json",
      "yarn.lock",
    ];

    const filteredTree = fullTree
      .filter((item) => {
        return !ignoredPatterns.some((pattern) => item.path.includes(pattern));
      })
      .map((item) => ({
        path: item.path,
        type: item.type === "blob" ? "file" : "folder",
      }));

    // 3. Generate a summary (Simple version for now: list top-level folders and key files)
    const topLevelFiles = filteredTree
      .filter((item) => !item.path.includes("/"))
      .map((item) => item.path)
      .join(", ");

    const structureSummary = `Repository structure: ${filteredTree.length} files/folders. Top level items: ${topLevelFiles}`;

    // 4. Update Project
    project.projectStructure = filteredTree;
    project.indexedCodeSummary = structureSummary;
    await project.save();

    res.json({
      message: "Repository indexed successfully",
      structure: filteredTree,
      summary: structureSummary,
    });
  } catch (err) {
    console.error("Index Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to index repository" });
  }
});

/* ================= HIERARCHICAL TREE BUILDER ================= */
function buildTreeFromFlatList(flatList) {
  const root = [];
  const sorted = [...flatList].sort((a, b) => a.path.localeCompare(b.path));

  for (const item of sorted) {
    const parts = item.path.split("/").filter(Boolean);
    if (parts.length === 0) continue;
    const isDir = item.type === "tree" || item.type === "dir" || item.type === "folder";

    let currentPath = "";
    let parentChildren = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLeaf = i === parts.length - 1;

      if (isLeaf) {
        let existing = parentChildren.find((n) => n.name === part);
        if (!existing) {
          const node = {
            name: part,
            path: currentPath,
            type: isDir ? "dir" : "file",
            size: item.size || 0,
            ...(isDir ? { children: [] } : {}),
          };
          parentChildren.push(node);
        } else if (isDir && !existing.children) {
          existing.type = "dir";
          existing.children = existing.children || [];
        }
      } else {
        let dirNode = parentChildren.find((n) => n.name === part && (n.type === "dir" || n.children));
        if (!dirNode) {
          dirNode = {
            name: part,
            path: currentPath,
            type: "dir",
            children: [],
          };
          parentChildren.push(dirNode);
        }
        parentChildren = dirNode.children;
      }
    }
  }

  function sortNodes(nodes) {
    nodes.sort((a, b) => {
      const aIsDir = a.type === "dir" || Boolean(a.children);
      const bIsDir = b.type === "dir" || Boolean(b.children);
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.children) {
        sortNodes(node.children);
      }
    }
  }

  sortNodes(root);
  return root;
}

// Recursive helper to fetch GitHub directory contents if Git Trees API fails
async function fetchGithubDirectoryRecursive(repo, dirPath = "", userToken = null, depth = 0, maxDepth = 6) {
  if (depth > maxDepth) return [];
  try {
    const encoded = dirPath ? encodeURIComponent(dirPath).replace(/%2F/g, "/") : "";
    const url = `https://api.github.com/repos/${repo}/contents/${encoded}`;
    const res = await githubApiRequest(url, { userToken });
    if (!Array.isArray(res.data)) return [];

    let flatItems = [];
    for (const item of res.data) {
      if (["node_modules", ".git", "dist", "build", ".next", ".turbo"].includes(item.name)) continue;

      flatItems.push({
        name: item.name,
        path: item.path,
        type: item.type === "dir" ? "dir" : "file",
        size: item.size || 0,
      });

      if (item.type === "dir") {
        const subItems = await fetchGithubDirectoryRecursive(repo, item.path, userToken, depth + 1, maxDepth);
        flatItems = flatItems.concat(subItems);
      }
    }
    return flatItems;
  } catch (err) {
    console.warn(`[GitHub Recursive Walker] Failed for ${dirPath}:`, err.message);
    return [];
  }
}

/* ================= RECURSIVE FILE TREE ================= */
router.get("/:id/tree", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const userToken = await getOptionalUserToken(req, project);

    // 1. If project is connected to a GitHub repository, fetch REAL repository tree from GitHub
    if (project.githubRepo) {
      let cleanRepo = formatRepo(project.githubRepo, project);

      // Resolve owner if missing
      if (cleanRepo && !cleanRepo.includes("/")) {
        try {
          const userRes = await githubApiRequest("https://api.github.com/user", { userToken });
          if (userRes.data?.login) {
            cleanRepo = `${userRes.data.login}/${cleanRepo}`;
          }
        } catch (_) {}
      }

      const [owner = "", repo = cleanRepo] = cleanRepo ? cleanRepo.split("/") : ["", ""];
      console.log(`[GitHub] owner: ${owner}`);
      console.log(`[GitHub] repo: ${repo}`);

      // Discover default branch dynamically from GitHub
      let defaultBranch = project.githubData?.default_branch || "main";
      try {
        const repoMeta = await githubApiRequest(`https://api.github.com/repos/${cleanRepo}`, { userToken });
        if (repoMeta.data?.default_branch) {
          defaultBranch = repoMeta.data.default_branch;
          if (!project.githubData) project.githubData = {};
          project.githubData.default_branch = defaultBranch;
          project.githubData.stars = repoMeta.data.stargazers_count;
          project.githubData.forks = repoMeta.data.forks_count;
          await project.save().catch(() => {});
        }
      } catch (metaErr) {
        console.log(`[GitHub] error: ${metaErr.response?.data?.message || metaErr.message}`);
      }

      console.log(`[GitHub] branch: ${defaultBranch}`);

      const branchesToTry = Array.from(new Set([defaultBranch, "main", "master", "develop", "trunk"])).filter(Boolean);

      let treeRes = null;
      let successfulBranch = defaultBranch;
      let apiStatus = null;
      let lastError = null;

      for (const branch of branchesToTry) {
        try {
          const url = `https://api.github.com/repos/${cleanRepo}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
          treeRes = await githubApiRequest(url, { userToken });
          apiStatus = treeRes.status;
          if (treeRes.data && Array.isArray(treeRes.data.tree) && treeRes.data.tree.length > 0) {
            successfulBranch = branch;
            console.log(`[GitHub] branch: ${successfulBranch}`);
            console.log(`[GitHub] response status: ${apiStatus}`);
            break;
          }
        } catch (err) {
          apiStatus = err.response?.status || 500;
          lastError = err.response?.data?.message || err.message;
        }
      }

      if (treeRes?.data?.tree && Array.isArray(treeRes.data.tree) && treeRes.data.tree.length > 0) {
        const ignoredPrefixes = ["node_modules/", ".git/", "dist/", "build/", ".next/", ".turbo/"];
        const rawItems = treeRes.data.tree
          .filter((item) => !ignoredPrefixes.some((ig) => item.path.startsWith(ig) || item.path.includes("/" + ig)))
          .map((item) => ({
            name: item.path.split("/").pop(),
            path: item.path,
            type: item.type === "tree" || item.type === "dir" ? "dir" : "file",
            size: item.size || 0,
          }));

        const fileNodes = rawItems.filter((i) => i.type === "file");
        console.log(`[GitHub] files count: ${fileNodes.length}`);

        const nestedTree = buildTreeFromFlatList(rawItems);

        project.projectStructure = nestedTree;
        await project.save().catch(() => {});

        return res.json({
          items: nestedTree,
          source: "github",
          branch: successfulBranch,
          empty: nestedTree.length === 0,
          isStarterOnly: false
        });
      }

      // Fallback: Recursive Contents API traversal
      try {
        const crawledItems = await fetchGithubDirectoryRecursive(cleanRepo, "", userToken);
        if (crawledItems.length > 0) {
          const fileNodes = crawledItems.filter((i) => i.type === "file");
          console.log(`[GitHub] response status: 200`);
          console.log(`[GitHub] files count: ${fileNodes.length}`);

          const nestedTree = buildTreeFromFlatList(crawledItems);
          return res.json({
            items: nestedTree,
            source: "github-recursive",
            branch: successfulBranch,
            empty: nestedTree.length === 0,
            isStarterOnly: false
          });
        }
      } catch (_) {}

      console.log(`[GitHub] response status: ${apiStatus || 500}`);
      console.log(`[GitHub] files count: 0`);
      if (lastError) {
        console.log(`[GitHub] error: ${lastError}`);
      }

      return res.status(500).json({
        error: `Failed to fetch repository files from GitHub. ${lastError || "Please verify the repository exists and is accessible."}`,
        items: []
      });
    }

    // 2. Non-GitHub project: read workspace disk
    const diskTree = workspaceFs.getWorkspaceTree(req.params.id);
    return res.json({
      items: diskTree || [],
      source: "workspace-disk",
      empty: !diskTree || diskTree.length === 0,
      isStarterOnly: false
    });
  } catch (err) {
    console.log(`[GitHub] error: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch repository tree", details: err.message, items: [] });
  }
});

/* ================= REPOSITORY BUNDLE (ALL FILES + CONTENTS IN ONE REQUEST) ================= */
router.get("/:id/tree/bundle", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const userToken = await getOptionalUserToken(req, project);

    // 1. If GitHub repository is linked, fetch REAL repository tree and contents directly from GitHub
    if (project.githubRepo) {
      let cleanRepo = formatRepo(project.githubRepo, project);

      // Resolve owner if missing
      if (cleanRepo && !cleanRepo.includes("/")) {
        try {
          const userRes = await githubApiRequest("https://api.github.com/user", { userToken });
          if (userRes.data?.login) {
            cleanRepo = `${userRes.data.login}/${cleanRepo}`;
          }
        } catch (_) {}
      }

      const [owner = "", repo = cleanRepo] = cleanRepo ? cleanRepo.split("/") : ["", ""];
      console.log(`[GitHub] owner: ${owner}`);
      console.log(`[GitHub] repo: ${repo}`);

      let defaultBranch = project.githubData?.default_branch || "main";
      try {
        const repoMeta = await githubApiRequest(`https://api.github.com/repos/${cleanRepo}`, { userToken });
        if (repoMeta.data?.default_branch) {
          defaultBranch = repoMeta.data.default_branch;
        }
      } catch (metaErr) {
        console.log(`[GitHub] error: ${metaErr.response?.data?.message || metaErr.message}`);
      }

      console.log(`[GitHub] branch: ${defaultBranch}`);

      const branchesToTry = Array.from(new Set([defaultBranch, "main", "master", "develop", "trunk"])).filter(Boolean);

      let treeRes = null;
      let successfulBranch = defaultBranch;
      let apiStatus = null;
      let lastError = null;

      for (const branch of branchesToTry) {
        try {
          const url = `https://api.github.com/repos/${cleanRepo}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
          treeRes = await githubApiRequest(url, { userToken });
          apiStatus = treeRes.status;
          if (treeRes.data && Array.isArray(treeRes.data.tree) && treeRes.data.tree.length > 0) {
            successfulBranch = branch;
            console.log(`[GitHub] branch: ${successfulBranch}`);
            console.log(`[GitHub] response status: ${apiStatus}`);
            break;
          }
        } catch (err) {
          apiStatus = err.response?.status || 500;
          lastError = err.response?.data?.message || err.message;
        }
      }

      if (treeRes?.data?.tree && Array.isArray(treeRes.data.tree) && treeRes.data.tree.length > 0) {
        const ignoredPrefixes = ["node_modules/", ".git/", "dist/", "build/", ".next/", ".turbo/"];
        const treeBlobs = treeRes.data.tree.filter(
          item => !ignoredPrefixes.some(ig => item.path.startsWith(ig) || item.path.includes("/" + ig))
        );

        const directories = treeBlobs.filter(i => i.type === "tree" || i.type === "dir").map(i => i.path);
        const fileNodes = treeBlobs.filter(i => i.type === "blob" || i.type === "file");

        console.log(`[GitHub] files count: ${fileNodes.length}`);

        // Fetch contents in parallel batches
        const files = [];
        const BATCH_SIZE = 20;
        for (let i = 0; i < fileNodes.length; i += BATCH_SIZE) {
          const batch = fileNodes.slice(i, i + BATCH_SIZE);
          const results = await Promise.all(
            batch.map(async (f) => {
              try {
                const rawUrl = `https://raw.githubusercontent.com/${cleanRepo}/${successfulBranch}/${f.path}`;
                const rawRes = await axios.get(rawUrl, {
                  headers: userToken ? { Authorization: userToken.startsWith("ghp_") ? `token ${userToken}` : `Bearer ${userToken}` } : {},
                  responseType: "text",
                  timeout: 10000,
                });
                const content = typeof rawRes.data === "string" ? rawRes.data : JSON.stringify(rawRes.data, null, 2);
                return { path: f.path, type: "file", content, size: content.length };
              } catch (_) {
                // Try GitHub Contents API if raw URL fails
                try {
                  const contentRes = await githubApiRequest(
                    `https://api.github.com/repos/${cleanRepo}/contents/${encodeURIComponent(f.path)}?ref=${successfulBranch}`,
                    { userToken }
                  );
                  if (contentRes.data?.content) {
                    const content = Buffer.from(contentRes.data.content, "base64").toString("utf-8");
                    return { path: f.path, type: "file", content, size: content.length };
                  }
                } catch (_) {}
                return { path: f.path, type: "file", content: "", size: 0 };
              }
            })
          );
          files.push(...results);
        }

        const flatItems = treeBlobs.map(i => ({
          name: i.path.split("/").pop(),
          path: i.path,
          type: i.type === "tree" || i.type === "dir" ? "dir" : "file",
          size: i.size || 0
        }));
        const tree = buildTreeFromFlatList(flatItems);

        return res.json({
          projectId: req.params.id,
          files,
          directories,
          tree,
          source: "github"
        });
      }

      console.log(`[GitHub] response status: ${apiStatus || 500}`);
      console.log(`[GitHub] files count: 0`);
      if (lastError) {
        console.log(`[GitHub] error: ${lastError}`);
      }

      // If GitHub returned no tree, return error rather than mock files
      return res.status(500).json({
        error: `Could not load repository ${cleanRepo} from GitHub. ${lastError || "Please check branch and access."}`,
        details: lastError || "Git trees API returned empty or inaccessible tree."
      });
    }

    // 2. Non-GitHub project: read workspace disk
    const diskDir = workspaceFs.getWorkspaceDir(req.params.id);
    const collectDiskFiles = (dir, relBase = "") => {
      const results = [];
      if (!fs.existsSync(dir)) return results;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const ignored = new Set([".git", "node_modules", "dist", "build", ".next", ".turbo", ".DS_Store"]);
      for (const entry of entries) {
        if (ignored.has(entry.name)) continue;
        const relPath = relBase ? `${relBase}/${entry.name}` : entry.name;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push({ path: relPath, type: "dir" });
          results.push(...collectDiskFiles(fullPath, relPath));
        } else {
          try {
            const content = fs.readFileSync(fullPath, "utf8");
            results.push({ path: relPath, type: "file", content, size: content.length });
          } catch (_) {
            results.push({ path: relPath, type: "file", content: "", size: 0 });
          }
        }
      }
      return results;
    };

    const diskFiles = collectDiskFiles(diskDir);
    const flatItems = diskFiles.map(f => ({
      name: f.path.split("/").pop(),
      path: f.path,
      type: f.type,
      size: f.size || 0
    }));
    const tree = buildTreeFromFlatList(flatItems);

    return res.json({
      projectId: req.params.id,
      files: diskFiles.filter(f => f.type === "file"),
      directories: diskFiles.filter(f => f.type === "dir").map(d => d.path),
      tree,
      source: "workspace-disk"
    });
  } catch (err) {
    console.error("Bundle Error:", err.message);
    res.status(500).json({ error: "Failed to fetch project bundle", details: err.message });
  }
});

/* ================= GIT STATUS ================= */
router.get("/:id/git-status", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    res.json({
      branch: "main",
      staged: [],
      unstaged: [],
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch git status" });
  }
});

/* ================= BATCH COMMIT & PUSH TO GITHUB ================= */
router.post("/:id/commit-and-push", async (req, res) => {
  try {
    const { commitMessage, files } = req.body;
    // files: [{ path, content }]
    if (!commitMessage || !files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "commitMessage and files[] are required" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const results = { pushed: [], failed: [] };

    // Save each file to workspace disk first
    for (const f of files) {
      if (!f.path || f.content === undefined) continue;
      try {
        workspaceFs.writeWorkspaceFile(req.params.id, f.path, f.content);
      } catch (_) {}
    }

    // Push to GitHub if a repo is linked
    if (project.githubRepo && GITHUB_TOKEN) {
      const repo = formatRepo(project.githubRepo);

      for (const f of files) {
        if (!f.path) continue;
        try {
          // Try to get the current SHA (file may already exist on GitHub)
          let sha = null;
          try {
            const existRes = await axios.get(
              `https://api.github.com/repos/${repo}/contents/${f.path}`,
              { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
            );
            sha = existRes.data?.sha || null;
          } catch (_) {
            // File doesn't exist on GitHub yet — create it
          }

          const payload = {
            message: commitMessage,
            content: Buffer.from(f.content || "").toString("base64"),
            ...(sha ? { sha } : {}),
          };

          await axios.put(
            `https://api.github.com/repos/${repo}/contents/${f.path}`,
            payload,
            { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
          );

          results.pushed.push(f.path);
        } catch (err) {
          console.error(`[CommitPush] Failed for ${f.path}:`, err.response?.data?.message || err.message);
          results.failed.push({ path: f.path, error: err.response?.data?.message || err.message });
        }
      }
    } else {
      // No GitHub repo linked — workspace-only save (already done above)
      results.pushed = files.map((f) => f.path);
    }

    // Log activity
    await logActivity({
      type: "CODE_PUSHED",
      title: "Code Committed & Pushed",
      description: `${results.pushed.length} file(s) committed: "${commitMessage}"`,
      metadata: { projectId: project._id, files: results.pushed },
    });

    res.json({
      success: true,
      message: project.githubRepo
        ? `Pushed ${results.pushed.length} file(s) to GitHub`
        : `Saved ${results.pushed.length} file(s) to workspace`,
      pushed: results.pushed,
      failed: results.failed,
    });
  } catch (err) {
    console.error("Commit & Push Error:", err.message);
    res.status(500).json({ error: "Failed to commit and push", details: err.message });
  }
});

/* ================= AI COMMIT MESSAGE SUGGESTION ================= */
router.post("/:id/suggest-commit-message", async (req, res) => {
  try {
    const { files } = req.body;
    // files: [{ path, status }]
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "files[] is required" });
    }

    const fileList = files.map((f) => `- ${f.path} (${f.status || "M"})`).join("\n");
    const prompt = `You are a senior software engineer. Generate a concise, professional Git commit message for the following changed files.\n\nChanged files:\n${fileList}\n\nRules:\n- Use imperative mood (e.g., "Add", "Fix", "Update", "Refactor")\n- Keep it under 72 characters\n- Be specific about what changed\n- Return ONLY the commit message, nothing else, no quotes, no explanation\n\nCommit message:`;

    const suggestion = await ai.generateResult(prompt);
    const cleaned = (suggestion || "").trim().replace(/^["']|["']$/g, "").split("\n")[0].trim();

    res.json({ suggestion: cleaned || `Update ${files.map((f) => f.path.split("/").pop()).join(", ")}` });
  } catch (err) {
    console.error("Suggest Commit Message Error:", err.message);
    // Graceful fallback — never error out
    const fallback = `Update ${(req.body.files || []).map((f) => f.path?.split("/").pop()).filter(Boolean).join(", ")}`;
    res.json({ suggestion: fallback });
  }
});


/* ================= WORKSPACE DISK FILESYSTEM & SYNC ================= */
router.get("/:id/workspace-info", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    const dir = workspaceFs.ensureWorkspaceDir(req.params.id, project || {});
    const sessions = terminalManager.listSessions(req.params.id);

    res.json({
      workspaceDir: dir,
      platform: os.platform(),
      defaultShell: os.platform() === "win32" ? "powershell" : "bash",
      availableShells: os.platform() === "win32" ? ["powershell", "cmd", "bash"] : ["bash", "zsh", "sh"],
      activeSessions: sessions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/workspace/files", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    workspaceFs.ensureWorkspaceDir(req.params.id, project || {});

    const hasLinkedRepo = Boolean(project?.githubRepo);
    const isStarter = hasLinkedRepo ? workspaceFs.isStarterTemplate(req.params.id) : false;
    const items = workspaceFs.getWorkspaceTree(req.params.id);

    res.json({
      items,
      isStarterOnly: isStarter,
      hasLinkedRepo
    });
  } catch (err) {
    res.status(500).json({ error: err.message, items: [], isStarterOnly: false });
  }
});

router.post("/:id/workspace/sync-repo", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const result = workspaceFs.syncRepoWorkspace(req.params.id, project);
    const items = workspaceFs.getWorkspaceTree(req.params.id);
    res.json({ ...result, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/workspace/file-content", async (req, res) => {
  try {
    const { path: filePath } = req.query;
    if (!filePath) return res.status(400).json({ error: "File path is required" });
    const content = workspaceFs.readWorkspaceFile(req.params.id, filePath);
    if (content === null) {
      return res.status(404).json({ error: "File not found on workspace disk" });
    }
    res.json({ type: "file", name: filePath.split("/").pop(), content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/workspace/save-file", async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath) return res.status(400).json({ error: "File path is required" });
    const result = workspaceFs.writeWorkspaceFile(req.params.id, filePath, content ?? "");
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id/workspace/delete-file", async (req, res) => {
  try {
    const { path: filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: "File path is required" });
    const success = workspaceFs.deleteWorkspaceFile(req.params.id, filePath);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= TERMINAL COMMAND EXECUTION (REST Fallback) ================= */
router.post("/:id/terminal/execute", async (req, res) => {
  try {
    const { command } = req.body;
    if (!command || typeof command !== "string") {
      return res.status(400).json({ error: "Command is required" });
    }

    const trimmed = command.trim();
    const forbidden = ["rm -rf /", "mkfs", "format", "shutdown", "reboot", "sudo"];
    if (forbidden.some((f) => trimmed.toLowerCase().includes(f))) {
      return res.status(403).json({ output: "Permission Denied: Command is not allowed in sandbox.\n" });
    }

    const workDir = workspaceFs.ensureWorkspaceDir(req.params.id);

    execCmd(trimmed, { cwd: workDir, timeout: 15000, maxBuffer: 1024 * 512 }, (error, stdout, stderr) => {
      let output = "";
      if (stdout) output += stdout;
      if (stderr) output += stderr;
      if (error && !output) output += error.message;

      res.json({
        exitCode: error ? error.code || 1 : 0,
        output: output || "Command finished with no output.\n",
      });
    });
  } catch (err) {
    res.status(500).json({ error: "Terminal execution failed", output: err.message });
  }
});

/* ================= PULL REQUESTS — LIST ================= */
router.get("/:id/pull-requests", async (req, res) => {
  try {
    const { status } = req.query; // open | merged | closed | all
    const filter = { projectId: req.params.id };
    if (status && status !== "all") filter.status = status;

    const prs = await PullRequest.find(filter)
      .populate("author", "fullName email avatar")
      .populate("mergedBy", "fullName email avatar")
      .sort({ createdAt: -1 });

    const openCount = await PullRequest.countDocuments({ projectId: req.params.id, status: "open" });
    const mergedCount = await PullRequest.countDocuments({ projectId: req.params.id, status: "merged" });
    const closedCount = await PullRequest.countDocuments({ projectId: req.params.id, status: "closed" });

    res.json({ pullRequests: prs, openCount, mergedCount, closedCount });
  } catch (err) {
    console.error("List PRs Error:", err.message);
    res.status(500).json({ error: "Failed to fetch pull requests" });
  }
});

/* ================= PULL REQUESTS — CREATE ================= */
router.post("/:id/pull-requests", async (req, res) => {
  try {
    const { title, description, sourceBranch, targetBranch, authorId } = req.body;

    if (!title?.trim()) return res.status(400).json({ error: "PR title is required" });
    if (!sourceBranch?.trim()) return res.status(400).json({ error: "Source branch is required" });
    if (!targetBranch?.trim()) return res.status(400).json({ error: "Target branch is required" });
    if (!authorId) return res.status(400).json({ error: "Author ID is required" });
    if (sourceBranch === targetBranch) {
      return res.status(400).json({ error: "Source and target branches must be different" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Get next PR number for this project
    const lastPR = await PullRequest.findOne({ projectId: req.params.id }).sort({ number: -1 });
    const nextNumber = (lastPR?.number || 0) + 1;

    const pr = await PullRequest.create({
      projectId: req.params.id,
      number: nextNumber,
      title: title.trim(),
      description: (description || "").trim(),
      author: authorId,
      sourceBranch: sourceBranch.trim(),
      targetBranch: targetBranch.trim(),
      status: "open",
    });

    const populated = await pr.populate("author", "fullName email avatar");

    await logActivity({
      type: "PR_CREATED",
      title: "Pull Request Opened",
      description: `PR #${nextNumber}: '${title}' opened in project '${project.projectName}'.`,
      metadata: { projectId: project._id, prId: pr._id },
    });

    res.status(201).json({ pullRequest: populated });
  } catch (err) {
    console.error("Create PR Error:", err.message);
    res.status(500).json({ error: "Failed to create pull request" });
  }
});

/* ================= PULL REQUESTS — GET SINGLE ================= */
router.get("/:id/pull-requests/:prId", async (req, res) => {
  try {
    const pr = await PullRequest.findOne({
      _id: req.params.prId,
      projectId: req.params.id,
    })
      .populate("author", "fullName email avatar")
      .populate("mergedBy", "fullName email avatar");

    if (!pr) return res.status(404).json({ error: "Pull request not found" });
    res.json({ pullRequest: pr });
  } catch (err) {
    console.error("Get PR Error:", err.message);
    res.status(500).json({ error: "Failed to fetch pull request" });
  }
});

/* ================= PULL REQUESTS — MERGE ================= */
router.patch("/:id/pull-requests/:prId/merge", async (req, res) => {
  try {
    const { mergedById } = req.body;

    const pr = await PullRequest.findOne({
      _id: req.params.prId,
      projectId: req.params.id,
    });

    if (!pr) return res.status(404).json({ error: "Pull request not found" });
    if (pr.status !== "open") {
      return res.status(400).json({ error: `Cannot merge a PR that is already ${pr.status}` });
    }

    pr.status = "merged";
    pr.mergedAt = new Date();
    pr.mergedBy = mergedById || null;
    await pr.save();

    const populated = await pr.populate(["author", "mergedBy"]);

    const project = await Project.findById(req.params.id);
    await logActivity({
      type: "PR_MERGED",
      title: "Pull Request Merged",
      description: `PR #${pr.number}: '${pr.title}' was merged in project '${project?.projectName}'.`,
      metadata: { projectId: req.params.id, prId: pr._id },
    });

    res.json({ pullRequest: populated });
  } catch (err) {
    console.error("Merge PR Error:", err.message);
    res.status(500).json({ error: "Failed to merge pull request" });
  }
});

/* ================= PULL REQUESTS — CLOSE ================= */
router.patch("/:id/pull-requests/:prId/close", async (req, res) => {
  try {
    const pr = await PullRequest.findOne({
      _id: req.params.prId,
      projectId: req.params.id,
    });

    if (!pr) return res.status(404).json({ error: "Pull request not found" });
    if (pr.status === "merged") {
      return res.status(400).json({ error: "Cannot close a merged pull request" });
    }
    if (pr.status === "closed") {
      return res.status(400).json({ error: "Pull request is already closed" });
    }

    pr.status = "closed";
    pr.closedAt = new Date();
    await pr.save();

    const populated = await pr.populate("author", "fullName email avatar");
    res.json({ pullRequest: populated });
  } catch (err) {
    console.error("Close PR Error:", err.message);
    res.status(500).json({ error: "Failed to close pull request" });
  }
});

/* ================= PULL REQUESTS — REOPEN ================= */
router.patch("/:id/pull-requests/:prId/reopen", async (req, res) => {
  try {
    const pr = await PullRequest.findOne({
      _id: req.params.prId,
      projectId: req.params.id,
    });

    if (!pr) return res.status(404).json({ error: "Pull request not found" });
    if (pr.status === "merged") {
      return res.status(400).json({ error: "Cannot reopen a merged pull request" });
    }
    if (pr.status === "open") {
      return res.status(400).json({ error: "Pull request is already open" });
    }

    pr.status = "open";
    pr.closedAt = null;
    await pr.save();

    const populated = await pr.populate("author", "fullName email avatar");
    res.json({ pullRequest: populated });
  } catch (err) {
    console.error("Reopen PR Error:", err.message);
    res.status(500).json({ error: "Failed to reopen pull request" });
  }
});

module.exports = router;
