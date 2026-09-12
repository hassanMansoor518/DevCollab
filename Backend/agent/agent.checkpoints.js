/**
 * agent.checkpoints.js - Targeted checkpoint and rollback system.
 *
 * 1. Targeted snapshots: Only snapshots files being modified, zero database bloat.
 * 2. Pure file rollback: Undo / Redo / Reject / Accept operate instantly without LLM calls (< 50ms).
 */

const WorkspaceFile = require('../model/workspaceFile.model');
const workspaceFs   = require('../services/workspaceFs.service');
const cache         = require('./agent.cache');

/**
 * Create a targeted checkpoint.
 * @param {object} task      - AgentTask document
 * @param {string} description
 * @param {string[]} [paths] - Specific file paths to snapshot.
 */
async function createCheckpoint(task, description, paths = []) {
  if (!task || !task.projectId) return null;

  try {
    const pid = String(task.projectId);
    const snapshot = {};

    if (paths && paths.length > 0) {
      // Fast path: snapshot only targeted files
      const fileResults = await Promise.all(
        paths.map(async (p) => {
          const cached = cache.getFile(pid, p);
          if (cached !== null) return { path: p, content: cached };
          const diskContent = workspaceFs.readWorkspaceFile(pid, p);
          if (diskContent !== null) return { path: p, content: diskContent };
          const dbFile = await WorkspaceFile.findOne({ projectId: pid, path: p, type: 'file' }, { path: 1, content: 1, _id: 0 }).lean();
          return dbFile ? { path: p, content: dbFile.content } : null;
        })
      );
      for (const f of fileResults) {
        if (f) snapshot[f.path] = f.content || '';
      }
    } else {
      // Fallback: read existing key workspace files
      const mustFiles = ['src/App.jsx', 'src/App.tsx', 'src/App.js', 'src/main.jsx', 'package.json'];
      for (const p of mustFiles) {
        const diskContent = workspaceFs.readWorkspaceFile(pid, p);
        if (diskContent !== null) {
          snapshot[p] = diskContent;
        }
      }
    }

    const checkpointId = 'cp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newCheckpoint = {
      checkpointId,
      description: description || 'Snapshot',
      createdAt: new Date(),
      snapshot,
    };

    if (!Array.isArray(task.checkpoints)) {
      task.checkpoints = [];
    }

    task.checkpoints.push(newCheckpoint);
    task.currentCheckpointIndex = task.checkpoints.length - 1;

    return newCheckpoint;
  } catch (err) {
    console.error('[Checkpoint] createCheckpoint failed:', err.message);
    return null;
  }
}

/**
 * Restore workspace files to a specific checkpoint snapshot.
 */
async function restoreCheckpoint(task, checkpointId, io) {
  if (!task || !task.checkpoints) return false;

  const targetIndex = task.checkpoints.findIndex(c => c.checkpointId === checkpointId);
  if (targetIndex === -1) return false;

  const checkpoint = task.checkpoints[targetIndex];
  const snapshot = checkpoint.snapshot || {};
  const pid = String(task.projectId);

  try {
    const paths = Object.keys(snapshot);

    // Restore snapshotted files concurrently
    await Promise.all(
      paths.map(async (relPath) => {
        await workspaceFs.writeWorkspaceFile(pid, relPath, snapshot[relPath]);
        cache.setFile(pid, relPath, snapshot[relPath]);
        cache.invalidateIndex(pid);
      })
    );

    task.currentCheckpointIndex = targetIndex;

    // Update filesChanged status in task
    if (Array.isArray(task.filesChanged)) {
      task.filesChanged.forEach(f => {
        if (f.path in snapshot) {
          f.applied = false;
        }
      });
    }

    await task.save();

    if (io) {
      paths.forEach(p => {
        io.emit('workspace:fs-change', { projectId: pid, event: 'restore', path: p });
      });
      io.emit('agent:checkpoint_restored', { taskId: task._id, checkpointId });
    }

    return true;
  } catch (err) {
    console.error('[Checkpoint] restoreCheckpoint failed:', err.message);
    return false;
  }
}

/**
 * Undo - restore to previous checkpoint.
 */
async function undoLastCheckpoint(task, io) {
  if (!task || !task.checkpoints || task.currentCheckpointIndex <= 0) {
    return { success: false, message: 'No previous checkpoint available for undo.' };
  }

  const targetIndex = task.currentCheckpointIndex - 1;
  const targetCheckpoint = task.checkpoints[targetIndex];
  const success = await restoreCheckpoint(task, targetCheckpoint.checkpointId, io);

  if (success) {
    task.logs.push({ timestamp: new Date(), text: 'Undo: restored to "' + targetCheckpoint.description + '"' });
    await task.save();
    return { success: true, message: 'Restored: ' + targetCheckpoint.description };
  }

  return { success: false, message: 'Undo failed.' };
}

/**
 * Redo - re-apply next checkpoint.
 */
async function redoNextCheckpoint(task, io) {
  if (!task || !task.checkpoints || task.currentCheckpointIndex >= task.checkpoints.length - 1) {
    return { success: false, message: 'No forward checkpoint available for redo.' };
  }

  const targetIndex = task.currentCheckpointIndex + 1;
  const targetCheckpoint = task.checkpoints[targetIndex];
  const success = await restoreCheckpoint(task, targetCheckpoint.checkpointId, io);

  if (success) {
    task.logs.push({ timestamp: new Date(), text: 'Redo: re-applied "' + targetCheckpoint.description + '"' });
    await task.save();
    return { success: true, message: 'Re-applied: ' + targetCheckpoint.description };
  }

  return { success: false, message: 'Redo failed.' };
}

module.exports = {
  createCheckpoint,
  restoreCheckpoint,
  undoLastCheckpoint,
  redoNextCheckpoint,
};
