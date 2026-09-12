const express = require("express");
const axios = require("axios");
const Project = require("../model/project.model");
const Workspace = require("../model/workspace.model");
const Analysis = require("../model/analysis.model");
const PullRequest = require("../model/pullRequest.model");
const User = require("../model/user.model");
const ai = require("../services/ai.service");
const { logActivity } = require("../services/activity.service");
require("dotenv").config();

const router = express.Router();
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const protectRoute = require("../middleware/secureRoute");

/* ================= GLOBAL HELPER ================= */
const formatRepo = (url) => {
  if (!url) return null;
  return url
    .replace("https://github.com/", "")
    .replace("http://github.com/", "")
    .replace("github.com/", "")
    .trim();
};

/* ================= Fetch GitHub Data ================= */
async function fetchGithubData(repo) {
  try {
    if (!repo) return null;

    const [repoRes, langRes] = await Promise.all([
      axios.get(`https://api.github.com/repos/${repo}`, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` },
      }),
      axios.get(`https://api.github.com/repos/${repo}/languages`, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` },
      }),
    ]);

    return {
      html_url: repoRes.data.html_url,
      description: repoRes.data.description,
      stars: repoRes.data.stargazers_count,
      forks: repoRes.data.forks_count,
      languages: Object.keys(langRes.data),
    };
  } catch (err) {
    console.error("GitHub fetch failed:", err.response?.data || err.message);
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
    const { path = "" } = req.query;
    const project = await Project.findById(req.params.id);

    if (!project || !project.githubRepo) {
      return res.status(400).json({ error: "No GitHub repo linked" });
    }

    const repo = formatRepo(project.githubRepo);
    const url = `https://api.github.com/repos/${repo}/contents/${path}`;

    const response = await axios.get(url, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });

    // 📁 Folder
    if (Array.isArray(response.data)) {
      return res.json({
        type: "folder",
        items: response.data.map((item) => ({
          name: item.name,
          path: item.path,
          type: item.type,
        })),
      });
    }

    // 📄 File
    const content = Buffer.from(response.data.content, "base64").toString("utf-8");
    res.json({ type: "file", name: response.data.name, content });
  } catch (err) {
    console.error("Contents Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch contents" });
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
    const parts = item.path.split("/");
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
          existing.children = [];
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

/* ================= RECURSIVE FILE TREE ================= */
router.get("/:id/tree", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // 1. If workspace disk has REAL cloned repo files (not a starter template), return workspace tree
    const isTemplate = workspaceFs.isStarterTemplate(req.params.id);
    if (!isTemplate) {
      const wsItems = workspaceFs.getWorkspaceTree(req.params.id);
      if (wsItems && wsItems.length > 0) {
        return res.json({ items: wsItems, source: "workspace" });
      }
    }

    // 2. No real workspace files — fetch from GitHub API
    if (!project.githubRepo) {
      return res.json({ items: [] });
    }

    const repo = formatRepo(project.githubRepo);
    let treeRes;
    const branchesToTry = [
      project.githubData?.default_branch,
      "main",
      "master",
    ].filter(Boolean);

    let fetched = false;
    const authHeader = GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};

    for (const branch of branchesToTry) {
      try {
        treeRes = await axios.get(
          `https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`,
          { headers: authHeader, timeout: 15000 }
        );
        if (treeRes.data && treeRes.data.tree && treeRes.data.tree.length > 0) {
          fetched = true;
          break;
        }
      } catch (err) {
        // Try without auth token if 401
        if (err.response?.status === 401 || err.response?.status === 403) {
          try {
            treeRes = await axios.get(
              `https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`,
              { timeout: 15000 }
            );
            if (treeRes.data && treeRes.data.tree && treeRes.data.tree.length > 0) {
              fetched = true;
              break;
            }
          } catch (_) { }
        }
      }
    }

    if (!fetched || !treeRes?.data?.tree) {
      return res.json({ items: [], source: "none" });
    }

    const ignoredPrefixes = ["node_modules/", ".git/", "dist/", "build/", ".next/", ".turbo/"];
    const rawItems = (treeRes.data.tree || [])
      .filter((item) => !ignoredPrefixes.some((ig) => item.path.startsWith(ig) || item.path.includes("/" + ig)))
      .map((item) => ({
        name: item.path.split("/").pop(),
        path: item.path,
        type: item.type === "blob" ? "file" : "dir",
        size: item.size || 0,
      }));

    const nestedTree = buildTreeFromFlatList(rawItems);
    res.json({ items: nestedTree, source: "github" });
  } catch (err) {
    console.error("Tree Error:", err.message);
    res.status(500).json({ error: "Failed to fetch repository tree" });
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
const workspaceFs = require("../services/workspaceFs.service");
const terminalManager = require("../services/TerminalManager");
const os = require("os");

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

    const items = workspaceFs.getWorkspaceTree(req.params.id);
    res.json({ items, isStarterOnly: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
const { exec: execCmd } = require("child_process");
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
