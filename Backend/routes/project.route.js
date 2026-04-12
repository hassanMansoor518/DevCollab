const express = require("express");
const axios = require("axios");
const Project = require("../model/project.model");
const Workspace = require("../model/workspace.model");
const Analysis = require("../model/analysis.model");
const ai = require("../services/ai.service");
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

/* ================= CREATE PROJECT ================= */
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

    const newProject = await Project.create({
      projectName,
      description,
      team,
      visibility,
      members: Array.isArray(members) ? members.filter(Boolean) : [],
      githubRepo: cleanRepo, // ✅ FIXED
      githubData,
    });

    console.log("PROJECT CREATED:", newProject);

    try {
      const workspace = await Workspace.create({
        name: projectName + " Workspace",
        projectId: newProject._id,
        members: newProject.members,
      });

      newProject.workspace = workspace._id;
      await newProject.save();
    } catch (err) {
      console.log("Workspace error:", err.message);
    }

    res.status(201).json(newProject);
  } catch (err) {
    console.error("Create Project Error:", err);
    res.status(500).json({ error: err.message });
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
        {
          headers: { Authorization: `token ${GITHUB_TOKEN}` },
        }
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

    res.json({
      type: "file",
      name: response.data.name,
      content,
    });
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
      {
        headers: { Authorization: `token ${GITHUB_TOKEN}` },
      }
    );

    const commitData = commitRes.data;

    const patchData = commitData.files
      .map((file) => `File: ${file.filename}\n${file.patch || ""}`)
      .join("\n\n");

    const analysisResult = await ai.analyzeCommit({
      message: commitData.commit.message,
      patch: patchData,
    });

    await Analysis.create({
      projectId: id,
      commitSha: sha,
      result: analysisResult,
    });

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

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (err) {
    console.error("Fetch Project Error:", err.message);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

module.exports = router;