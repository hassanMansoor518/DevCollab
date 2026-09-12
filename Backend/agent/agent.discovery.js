/**
 * agent.discovery.js - Autonomous Workspace Context & File Discovery Engine.
 *
 * Provides the Agent with:
 * 1. Full Workspace File Tree (recursively flattens all files in src, components, pages, styles)
 * 2. Smart Relevance Ranking (findRelevantFiles)
 * 3. Editor Focus (active file & selected code as context, NOT boundary)
 * 4. Architecture & Component Awareness (Navbar, Header, Layouts, Router, App.jsx, Pages)
 */

const path = require('path');
const agentTools = require('./agent.tools');
const cache = require('./agent.cache');

const IGNORED_DIRECTORIES = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.cache',
  '.next',
  'vendor',
  '.turbo',
];

const IGNORED_EXTENSIONS = [
  '.lock',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.webp',
  '.mp4',
  '.mp3',
  '.pdf',
  '.zip',
  '.woff',
  '.woff2',
  '.ttf',
  '.map',
];

function isUsefulFile(filePath) {
  if (!filePath || typeof filePath !== 'string') return false;
  const normalized = filePath.replace(/\\/g, '/');
  for (const dir of IGNORED_DIRECTORIES) {
    if (normalized === dir || normalized.startsWith(dir + '/') || normalized.includes('/' + dir + '/')) {
      return false;
    }
  }
  const ext = path.extname(normalized).toLowerCase();
  if (IGNORED_EXTENSIONS.includes(ext)) return false;
  return true;
}

/**
 * Recursively flatten a nested tree from workspaceFs into a flat array of file objects
 */
function flattenTree(items) {
  const result = [];
  function recurse(list) {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      if (item.type === 'file') {
        result.push(item.path);
      }
      if (item.children && Array.isArray(item.children)) {
        recurse(item.children);
      }
    }
  }
  recurse(items);
  return result;
}

/**
 * Get clean flat list of all files in workspace recursively
 */
async function getWorkspaceFileList(projectId) {
  const pid = String(projectId);
  const treeRes = await agentTools.listWorkspace(pid);
  const rawItems = treeRes.items || [];
  const flatPaths = flattenTree(rawItems);
  return flatPaths.filter(p => isUsefulFile(p));
}

/**
 * Intelligently rank and select relevant files for a task.
 */
async function findRelevantFiles(projectId, prompt, editorContext = {}, targetHints = [], maxFiles = 8) {
  const pid = String(projectId);
  const allFiles = await getWorkspaceFileList(pid);

  if (allFiles.length === 0) {
    return [];
  }

  const promptLower = (prompt || '').toLowerCase();
  const keywords = promptLower
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  const scored = [];

  for (const filePath of allFiles) {
    const fLower = filePath.toLowerCase();
    const basename = path.basename(filePath).toLowerCase();
    let score = 0;
    let reasons = [];

    // 1. Explicitly targeted hints (@mention or path mentioned)
    if (targetHints && targetHints.some(hint => fLower.includes(hint.toLowerCase()))) {
      score += 100;
      reasons.push('explicit_target');
    }

    // 2. Active editor file
    if (editorContext.activeFile && fLower === editorContext.activeFile.toLowerCase()) {
      score += 80;
      reasons.push('active_editor_file');
    }

    // 3. Open tabs
    if (Array.isArray(editorContext.openTabs) && editorContext.openTabs.some(t => t && t.toLowerCase() === fLower)) {
      score += 50;
      reasons.push('open_tab');
    }

    // 4. Core Entry & Layout Architecture (Essential for preventing regressions)
    if (['src/app.jsx', 'src/app.tsx', 'src/app.js'].includes(fLower)) {
      score += 70;
      reasons.push('main_app');
    }
    if (['src/main.jsx', 'src/main.tsx', 'src/index.jsx', 'src/index.js'].includes(fLower)) {
      score += 35;
      reasons.push('entry_file');
    }

    // 5. Common Layout & Navigation components (Always give high visibility so agent doesn't wipe them)
    if (/(navbar|header|nav|sidebar|footer|layout|menu|router|routes)/i.test(basename)) {
      score += 60;
      reasons.push('navigation_layout');
    }

    // 6. Keyword matching in file path / name
    for (const kw of keywords) {
      if (basename.includes(kw)) {
        score += 45;
        reasons.push(`matches_${kw}`);
      } else if (fLower.includes(kw)) {
        score += 20;
        reasons.push(`path_${kw}`);
      }
    }

    // 7. Component files in src/components or src/pages
    if (fLower.startsWith('src/components/') || fLower.startsWith('src/pages/') || fLower.startsWith('src/views/')) {
      score += 15;
    }

    // 8. Styling files
    if (['src/index.css', 'src/app.css', 'src/styles.css'].includes(fLower)) {
      score += 25;
      reasons.push('core_styles');
    }

    scored.push({ path: filePath, score, reasons });
  }

  scored.sort((a, b) => b.score - a.score);

  const selected = scored.slice(0, maxFiles);
  return selected;
}

/**
 * Build targeted code context for Smart & Autonomous paths
 */
async function buildTargetedContext(projectId, rankedFiles, editorContext = {}, perf = null) {
  const pid = String(projectId);
  if (perf) perf.start('context');

  const allFiles = await getWorkspaceFileList(pid);
  const pathsToRead = Array.isArray(rankedFiles)
    ? rankedFiles.map(f => (typeof f === 'string' ? f : f.path))
    : [];

  // Ensure App.jsx and main entry points are present if available
  const mustHave = ['src/App.jsx', 'src/App.tsx', 'src/App.js'];
  for (const m of mustHave) {
    if (allFiles.includes(m) && !pathsToRead.includes(m)) {
      pathsToRead.push(m);
    }
  }

  const fileContents = await Promise.all(
    pathsToRead.slice(0, 10).map(async (filePath) => {
      const res = await agentTools.readFile(pid, filePath);
      if (res.success) {
        return { path: filePath, content: res.content };
      }
      return null;
    })
  );

  if (perf) perf.end('context');

  const validFiles = fileContents.filter(Boolean);

  let output = '';

  // 1. Full Workspace Structure
  output += '=== WORKSPACE FILE TREE (ALL FILES IN REPOSITORY) ===\n';
  if (allFiles.length > 0) {
    output += allFiles.slice(0, 60).join('\n') + '\n';
    if (allFiles.length > 60) output += `// ... and ${allFiles.length - 60} more files\n`;
  } else {
    output += '(New or empty workspace)\n';
  }
  output += '\n';

  // 2. Editor Focus
  if (editorContext.activeFile) {
    output += `CURRENT EDITOR FOCUS: ${editorContext.activeFile}\n`;
  }
  if (editorContext.selectedCode && editorContext.selectedCode.trim()) {
    output += `SELECTED CODE IN EDITOR:\n\`\`\`\n${editorContext.selectedCode.trim().slice(0, 1500)}\n\`\`\`\n\n`;
  }

  // 3. Existing Components & Key Code
  output += '=== EXISTING SOURCE FILES (PRESERVE ALL EXISTING WORKING FUNCTIONALITY) ===\n';
  for (const f of validFiles) {
    const trimmed = (f.content || '').length > 4000
      ? f.content.slice(0, 4000) + '\n// ... [remaining code omitted for brevity]'
      : f.content;
    output += `--- ${f.path} ---\n${trimmed}\n\n`;
  }

  return output.trim();
}

/**
 * Build rich workspace context for Fast Path
 */
async function buildWorkspaceContext(projectId, prompt, editorContext = {}, perf = null) {
  const pid = String(projectId);
  if (perf) perf.start('context');

  const allFiles = await getWorkspaceFileList(pid);
  const ranked = await findRelevantFiles(pid, prompt, editorContext, [], 5);

  const pathsToRead = new Set(ranked.map(r => r.path));

  // Also include active file and entry candidates
  if (editorContext.activeFile && isUsefulFile(editorContext.activeFile)) {
    pathsToRead.add(editorContext.activeFile);
  }

  const entryCandidates = [
    'src/App.jsx', 'src/App.tsx', 'src/App.js',
    'src/main.jsx', 'src/main.tsx',
    'package.json'
  ];
  for (const c of entryCandidates) {
    if (allFiles.includes(c)) pathsToRead.add(c);
  }

  const fileContents = await Promise.all(
    Array.from(pathsToRead).slice(0, 6).map(async (filePath) => {
      const res = await agentTools.readFile(pid, filePath);
      if (res.success) {
        return { path: filePath, content: res.content };
      }
      return null;
    })
  );

  if (perf) perf.end('context');

  const validFiles = fileContents.filter(Boolean);

  let output = '';

  // 1. Workspace Tree
  output += '=== WORKSPACE FILE TREE (TOP FILES) ===\n';
  if (allFiles.length > 0) {
    output += allFiles.slice(0, 60).join('\n') + '\n';
    if (allFiles.length > 60) output += `// ... and ${allFiles.length - 60} more files\n`;
  } else {
    output += '(New or empty workspace)\n';
  }
  output += '\n';

  // 2. Focus
  if (editorContext.activeFile) {
    output += `CURRENT ACTIVE FILE: ${editorContext.activeFile}\n`;
  }
  if (editorContext.selectedCode && editorContext.selectedCode.trim()) {
    output += `SELECTED CODE:\n\`\`\`\n${editorContext.selectedCode.trim().slice(0, 1500)}\n\`\`\`\n\n`;
  }

  // 3. Existing Code
  output += '=== EXISTING COMPONENT & APP CODE (PRESERVE EXISTING FEATURES) ===\n';
  for (const f of validFiles) {
    const trimmed = (f.content || '').length > 4000
      ? f.content.slice(0, 4000) + '\n// ... [remaining code omitted for brevity]'
      : f.content;
    output += `--- ${f.path} ---\n${trimmed}\n\n`;
  }

  return output.trim();
}

module.exports = {
  getWorkspaceFileList,
  findRelevantFiles,
  buildTargetedContext,
  buildWorkspaceContext,
  isUsefulFile,
  flattenTree,
};
