const express = require("express");
const axios = require("axios");
const Project = require("../model/project.model");
const Workspace = require("../model/workspace.model");
const Analysis = require("../model/analysis.model");
const ai = require("../services/ai.service");
const { logActivity } = require("../services/activity.service");
require("dotenv").config();

const router = express.Router();
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

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
      members: Array.isArray(members) ? members.filter(Boolean) : [],
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
      });

      newProject.workspace = workspace._id;
      await newProject.save();

      console.log("WORKSPACE CREATED:", workspace);
    } catch (err) {
      console.error("Workspace creation error:", err.message);
    }

    // ✅ Step 3: Log Activity
    await logActivity({
      type: "PROJECT_CREATED",
      title: "New Project Created",
      description: `Project '${projectName}' has been initialized with visibility: ${visibility}.`,
      metadata: { projectId: newProject._id }
    });

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

    // ✅ Step 4: Log Activity
    await logActivity({
      type: "TEAM_MEMBER_ADDED",
      title: "Team Member Added",
      description: `A new member has joined the project '${project.projectName}'.`,
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

    if (!project || !project.githubRepo) {
      return res.status(400).json({ error: "No GitHub repo linked" });
    }

    const repo = formatRepo(project.githubRepo);
    let allCommits = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get(
        `https://api.github.com/repos/${repo}/commits?per_page=100&page=${page}`,
        { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
      );

      const commits = response.data;
      if (commits.length === 0) {
        hasMore = false;
      } else {
        allCommits = [...allCommits, ...commits];
        page++;
      }
    }

    const formattedCommits = allCommits.map((c) => ({
      sha: c.sha,
      message: c.commit.message,
      author: c.commit.author.name,
      date: c.commit.author.date,
      url: c.html_url,
    }));

    res.json({ commits: formattedCommits });
  } catch (err) {
    console.error("Commits Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch commits" });
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

/* ================= GET ALL PROJECTS ================= */
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find();
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

    // ✅ Step 3: Log Activity
    await logActivity({
      type: "PROJECT_DELETED",
      title: "Project Deleted",
      description: `Project '${deleted.projectName}' and its associated workspace have been removed.`,
      metadata: { projectId: deleted._id }
    });

    res.json({ success: true, message: "Project and workspace deleted" });
  } catch (err) {
    console.error("Delete Project Error:", err.message);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

module.exports = router;