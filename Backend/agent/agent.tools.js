/**
 * agent.tools.js - Autonomous Workspace Tool Capabilities.
 *
 * Tools:
 * - listWorkspace: List all files and directories in the workspace
 * - readFile: Read a file from workspace (cache-first)
 * - readFilesBatch: Read multiple files concurrently
 * - writeFile / updateFile: Update an existing file
 * - createFile: Create a new file (automatically creates parent directories)
 * - createDirectory: Create a new directory
 * - deleteFile: Delete a file or folder
 * - renameFile / moveFile: Move/rename a file
 * - searchCode: Ripgrep / disk code search
 * - applyPatch: Line-level patch
 */

const { exec, spawn } = require('child_process');
const path = require('path');
const workspaceFs = require('../services/workspaceFs.service');
const WorkspaceFile = require('../model/workspaceFile.model');
const cache = require('./agent.cache');

// 1. List workspace
async function listWorkspace(projectId) {
  try {
    const pid = String(projectId);
    const cached = cache.getIndex(pid);
    if (cached) return { success: true, items: cached, cached: true };

    const items = await workspaceFs.getWorkspaceTree(pid);
    cache.setIndex(pid, items);
    return { success: true, items: items };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// 2. Read single file
async function readFile(projectId, filePath) {
  try {
    const pid = String(projectId);
    const cached = cache.getFile(pid, filePath);
    if (cached !== null) {
      return { success: true, path: filePath, content: cached, cached: true };
    }

    const content = await workspaceFs.readWorkspaceFile(pid, filePath);
    if (content !== null) {
      cache.setFile(pid, filePath, content);
      return { success: true, path: filePath, content: content };
    }
    return { success: false, error: 'File not found: ' + filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// 3. Read files batch concurrently
async function readFilesBatch(projectId, filePaths) {
  const results = await Promise.all(
    (filePaths || []).map(p => readFile(projectId, p))
  );
  return results;
}

// 4. Write / Update file
async function writeFile(projectId, filePath, content) {
  try {
    const pid = String(projectId);
    await workspaceFs.writeWorkspaceFile(pid, filePath, content != null ? content : '');
    cache.setFile(pid, filePath, content != null ? content : '');
    cache.invalidateIndex(pid);
    return { success: true, path: filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// 5. Create new file
async function createFile(projectId, filePath, content) {
  try {
    const pid = String(projectId);
    await workspaceFs.writeWorkspaceFile(pid, filePath, content || '');
    cache.setFile(pid, filePath, content || '');
    cache.invalidateIndex(pid);
    return { success: true, path: filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// 6. Create directory
async function createDirectory(projectId, dirPath) {
  try {
    const pid = String(projectId);
    workspaceFs.createDirectory(pid, dirPath);
    cache.invalidateIndex(pid);
    return { success: true, path: dirPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// 7. Delete file / directory
async function deleteFile(projectId, filePath) {
  try {
    const pid = String(projectId);
    const success = workspaceFs.deleteWorkspaceFile(pid, filePath);
    cache.invalidateFile(pid, filePath);
    cache.invalidateIndex(pid);
    return { success: success, path: filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// 8. Rename / move file
async function renameFile(projectId, oldPath, newPath) {
  try {
    const pid = String(projectId);
    const res = workspaceFs.renameWorkspaceFile(pid, oldPath, newPath);
    cache.invalidateFile(pid, oldPath);
    cache.invalidateFile(pid, newPath);
    cache.invalidateIndex(pid);
    return res;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// 9. Search code
async function searchCode(projectId, query, maxResults = 20) {
  if (!query) return { success: true, matches: [] };
  const pid = String(projectId);

  const cached = cache.getSearch(pid, query);
  if (cached) return { success: true, query, matches: cached, cached: true };

  try {
    const workDir = await workspaceFs.getWorkspaceDir(pid);
    const files = await WorkspaceFile.find(
      { projectId: pid, type: 'file' },
      { path: 1, content: 1, _id: 0 }
    ).lean();

    const qLower = query.toLowerCase();
    const matchedFiles = files.filter(
      f => f.path.toLowerCase().includes(qLower) || (f.content && f.content.toLowerCase().includes(qLower))
    );

    const matches = matchedFiles.slice(0, maxResults).map(f => {
      let snippet = '';
      if (f.content) {
        const idx = f.content.toLowerCase().indexOf(qLower);
        if (idx !== -1) {
          const start = Math.max(0, idx - 60);
          const end = Math.min(f.content.length, idx + 140);
          snippet = f.content.substring(start, end).replace(/\n/g, ' ');
        }
      }
      return { path: f.path, snippet };
    });

    cache.setSearch(pid, query, matches);
    return { success: true, query, matches };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// 10. Run Command
async function runCommand(projectId, command, io, opts) {
  const workDir = await workspaceFs.getWorkspaceDir(projectId);
  const trimmed = (command || '').trim();
  const timeout = (opts && opts.timeout) ? opts.timeout : 60000;

  const forbidden = ['rm -rf /', 'shutdown', 'reboot', 'mkfs', 'format'];
  if (forbidden.some(f => trimmed.toLowerCase().includes(f))) {
    return {
      success: false,
      output: 'Security Check Failed: Forbidden command blocked by agent sandbox.\n',
      exitCode: 1,
    };
  }

  return new Promise((resolve) => {
    exec(trimmed, { cwd: workDir, timeout: timeout, maxBuffer: 1024 * 512 }, (error, stdout, stderr) => {
      let output = '';
      if (stdout) output += stdout;
      if (stderr) output += stderr;
      if (error && !output) output += error.message;

      const exitCode = error ? (error.code || 1) : 0;
      if (io) {
        io.emit('workspace:fs-change', { projectId: String(projectId), event: 'terminal-exec', path: '' });
      }

      resolve({
        success: exitCode === 0,
        exitCode: exitCode,
        command: trimmed,
        output: output || 'Command completed.\n',
      });
    });
  });
}

module.exports = {
  listWorkspace,
  listFiles: listWorkspace,
  readFile,
  readFilesBatch,
  writeFile,
  updateFile: writeFile,
  createFile,
  createDirectory,
  deleteFile,
  renameFile,
  moveFile: renameFile,
  searchCode,
  runCommand,
};
