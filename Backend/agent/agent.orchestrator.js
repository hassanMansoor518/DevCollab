/**
 * agent.orchestrator.js - 3-Tier Autonomous Agent Orchestrator.
 *
 * Execution Modes:
 * 1. ⚡ Fast Mode: Simple/trivial tasks, 1 LLM call, targeted discovery, sub-10s execution.
 * 2. 🧠 Smart Mode: Medium tasks (2-4 files), targeted reasoning + patch generation, 10-25s execution.
 * 3. 🤖 Autonomous Mode: Complex tasks (auth, full features, migrations), multi-step planning.
 */

const AgentTask = require('../model/agentTask.model');
const agentTools = require('./agent.tools');
const checkpoints = require('./agent.checkpoints');
const aiService = require('../services/ai.service');
const cache = require('./agent.cache');
const PerfTracker = require('./agent.perf');
const { classify, getRelevantPaths } = require('./agent.classifier');
const { findRelevantFiles, buildTargetedContext } = require('./agent.discovery');
const { applyPatches, validateSyntax, createSimpleDiff } = require('./agent.patcher');
const { runFastPath } = require('./agent.fast_path');
const { runMultiFileGeneration } = require('./agent.multi_file');

// In-memory execution map
const activeExecutions = new Map();

// Operation Timeouts
const TIMEOUTS = {
  fast: 60000,         // 60s max for fast mode
  smart: 120000,       // 2 min max for smart mode
  autonomous: 900000,  // 15 min max for autonomous multi-file mode
};

const WATCHDOG_WARN_MS = 45000;
const MAX_RETRIES = 1;

/**
 * Emit real-time status update to client via Socket.IO
 */
function emitTaskUpdate(io, task, eventName = 'agent:status') {
  if (!io || !task) return;

  io.emit(eventName, {
    taskId: String(task._id),
    projectId: String(task.projectId),
    state: task.state,
    mode: task.mode || 'fast',
    prompt: task.prompt,
    summary: task.summary,
    activeTaskText: task.activeTaskText,
    plan: task.plan || [],
    filesChanged: task.filesChanged || [],
    checkpoints: (task.checkpoints || []).map(c => ({
      checkpointId: c.checkpointId,
      description: c.description,
      createdAt: c.createdAt,
    })),
    currentCheckpointIndex: task.currentCheckpointIndex,
    terminalOutput: (task.terminalOutput || []).slice(-10),
    messages: (task.messages || []).slice(-5),
    logs: (task.logs || []).slice(-15),
    errorDetails: task.errorDetails,
    retryCount: task.retryCount,
  });
}

/**
 * Persist task state to MongoDB safely
 */
async function saveTask(task) {
  if (!task) return;
  try {
    await task.save();
  } catch (err) {
    try {
      await AgentTask.findByIdAndUpdate(task._id, {
        $set: {
          state: task.state,
          mode: task.mode,
          activeTaskText: task.activeTaskText,
          summary: task.summary,
          plan: task.plan,
          filesChanged: task.filesChanged,
          checkpoints: task.checkpoints,
          currentCheckpointIndex: task.currentCheckpointIndex,
          terminalOutput: task.terminalOutput,
          messages: task.messages,
          logs: task.logs,
          errorDetails: task.errorDetails,
          retryCount: task.retryCount,
        },
      });
    } catch (dbErr) {
      console.warn('[Agent] DB save fallback warning:', dbErr.message);
    }
  }
}

function touchProgress(taskId) {
  const ex = activeExecutions.get(String(taskId));
  if (ex) ex.lastProgressAt = Date.now();
}

function isCancelled(taskId) {
  const ex = activeExecutions.get(String(taskId));
  return !ex || ex.cancelled;
}

function startWatchdog(taskId, mode, io) {
  const ex = activeExecutions.get(String(taskId));
  if (!ex) return;

  const maxTime = TIMEOUTS[mode] || TIMEOUTS.fast;

  ex.warnTimer = setTimeout(() => {
    if (isCancelled(taskId)) return;
    if (io) {
      io.emit('agent:watchdog', {
        taskId: String(taskId),
        message: 'Agent operation taking longer than expected.',
      });
    }
  }, WATCHDOG_WARN_MS);

  ex.killTimer = setTimeout(() => {
    if (isCancelled(taskId)) return;
    console.warn(`[Agent Watchdog] Task ${taskId} timed out (${maxTime}ms). Terminating.`);
    const entry = activeExecutions.get(String(taskId));
    if (entry) entry.cancelled = true;
  }, maxTime);
}

function clearWatchdog(taskId) {
  const ex = activeExecutions.get(String(taskId));
  if (!ex) return;
  if (ex.warnTimer) clearTimeout(ex.warnTimer);
  if (ex.killTimer) clearTimeout(ex.killTimer);
}

/**
 * Smart Path Executor (Medium tasks: 2-4 files, targeted patches)
 */
async function runSmartPath(task, io, perf, classification, editorContext = {}) {
  const pid = String(task.projectId);
  const taskId = String(task._id);

  perf.start('file-discovery');
  task.state = 'ANALYZING';
  task.activeTaskText = 'Locating related project files...';
  emitTaskUpdate(io, task);

  const rankedFiles = await findRelevantFiles(
    pid,
    task.prompt,
    editorContext,
    classification.targetHints,
    4
  );
  perf.end('file-discovery');

  perf.start('context');
  const fileContext = await buildTargetedContext(pid, rankedFiles, editorContext, perf);
  perf.end('context');

  const pathsToSnapshot = rankedFiles.map(f => f.path);
  await checkpoints.createCheckpoint(task, `Before: ${task.prompt.slice(0, 30)}`, pathsToSnapshot);

  perf.start('llm');
  perf.inc('llmCalls');
  task.state = 'EXECUTING';
  task.activeTaskText = 'Generating component updates...';
  emitTaskUpdate(io, task);

  const systemPrompt = `You are DevCollab Smart AI Agent. You make targeted, high-quality multi-file updates.
Respond ONLY with valid JSON matching this schema:
{
  "summary": "Short description of changes",
  "plan": [
    { "id": 1, "text": "Step description", "status": "completed", "filesInvolved": ["src/App.jsx"] }
  ],
  "files_to_change": [
    {
      "path": "src/App.jsx",
      "action": "modify" | "create",
      "content": "Full code for new/modified file",
      "explanation": "What changed"
    }
  ]
}

CRITICAL RULES:
1. PRESERVE EXISTING FUNCTIONALITY (ZERO REGRESSIONS):
   - NEVER drop or delete existing components (like Navbar, Header, Sidebar, or existing pages).
   - When adding a page, keep all existing pages and integrate them into navigation state or routes.
   - When fixing bugs (e.g. navbar navigation not working), fix the event handlers/links, DO NOT delete the navbar!
2. COMPLETE CODE:
   - Provide full, runnable code for each file without placeholders.`;

  const userPrompt = `USER REQUEST: "${task.prompt}"

RELEVANT CODEBASE FILES:
${fileContext}

Provide your JSON response now.`;

  let llmResponse = '';
  try {
    llmResponse = await aiService.generateWithTools(systemPrompt, userPrompt);
  } catch (err) {
    perf.end('llm');
    throw new Error('Smart Path AI generation failed: ' + err.message);
  }
  perf.end('llm');

  perf.start('patch');
  let parsed = { summary: 'Completed updates', plan: [], files_to_change: [] };
  try {
    let clean = llmResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const fb = clean.indexOf('{');
    const lb = clean.lastIndexOf('}');
    if (fb !== -1 && lb !== -1) clean = clean.substring(fb, lb + 1);
    parsed = JSON.parse(clean);
  } catch (_) {}

  const filesChanged = [];
  const filesToChange = parsed.files_to_change || [];

  for (const item of filesToChange) {
    if (!item.path) continue;
    const origRes = await agentTools.readFile(pid, item.path);
    const origContent = origRes.success ? origRes.content : '';

    await agentTools.writeFile(pid, item.path, item.content || '');
    cache.setFile(pid, item.path, item.content || '');
    cache.invalidateIndex(pid);
    perf.inc('filesWritten');

    if (io) {
      io.emit('workspace:fs-change', { projectId: pid, event: 'change', path: item.path });
    }

    filesChanged.push({
      path: item.path,
      status: origContent ? 'M' : 'A',
      originalContent: origContent,
      newContent: item.content || '',
      explanation: item.explanation || parsed.summary,
      diff: createSimpleDiff(origContent, item.content || ''),
      applied: true,
    });
  }
  perf.end('patch');

  perf.start('validation');
  for (const f of filesChanged) {
    validateSyntax(f.path, f.newContent);
  }
  perf.end('validation');

  task.summary = parsed.summary || 'Completed smart execution';
  task.plan = (parsed.plan || []).length > 0 ? parsed.plan : [
    { id: 1, text: 'Analyzed context', status: 'completed', filesInvolved: pathsToSnapshot },
    { id: 2, text: task.summary, status: 'completed', filesInvolved: pathsToSnapshot },
  ];
  task.filesChanged = filesChanged;

  return {
    summary: task.summary,
    plan: task.plan,
    filesChanged,
    terminalOutput: [],
  };
}

/**
 * Autonomous Path Executor (Complex multi-step tasks)
 */
async function runAutonomousPath(task, io, perf, classification, editorContext = {}) {
  return await runMultiFileGeneration(task, io, perf, editorContext);
}

/**
 * Check if a user prompt is requesting multi-file or full project generation
 */
function isMultiFileRequest(prompt, mode) {
  if (mode === 'autonomous') return true;
  const p = (prompt || '').toLowerCase();
  const multiKeywords = [
    'ecommerce', 'website', 'multiple pages', 'full stack', 'dashboard', 'portfolio',
    'saas', 'complete app', 'entire app', 'full feature', 'auth system', 'login and signup',
    'several files', 'components and pages', 'create pages'
  ];
  return multiKeywords.some(kw => p.includes(kw));
}

/**
 * Main Orchestrator Loop
 */
async function runAgentLoop(taskId, io) {
  const task = await AgentTask.findById(taskId);
  if (!task) return;

  const pid = String(task.projectId);
  activeExecutions.set(String(taskId), {
    cancelled: false,
    lastProgressAt: Date.now(),
    warnTimer: null,
    killTimer: null,
  });

  const editorContext = {
    activeFile: task.activeFile,
    selectedCode: task.selectedCode,
    openTabs: task.openTabs || [],
  };

  const perf = new PerfTracker(String(taskId));

  try {
    // 1. CLASSIFY TASK
    perf.start('classification');
    const classification = classify(task.prompt, {
      modeOverride: task.mode,
      activeFile: task.activeFile,
      selectedCode: task.selectedCode,
    });
    perf.end('classification');

    task.mode = classification.mode;
    perf.setMode(classification.mode);

    const isMultiFile = isMultiFileRequest(task.prompt, classification.mode);

    console.log(`[Agent] Starting task ${taskId} in ${classification.mode.toUpperCase()} mode (isMultiFile: ${isMultiFile})`);

    startWatchdog(taskId, classification.mode, io);

    task.state = 'ANALYZING';
    task.activeTaskText = isMultiFile
      ? '🤖 Autonomous Mode: Planning full architecture & batches...'
      : classification.mode === 'smart'
      ? '🧠 Smart Mode: Analyzing dependencies...'
      : '⚡ Fast Mode: Preparing patch...';

    task.logs.push({
      timestamp: new Date(),
      text: `Mode: ${classification.mode.toUpperCase()} (${classification.op})`,
    });

    emitTaskUpdate(io, task);
    touchProgress(taskId);

    // 2. ROUTE TO EXECUTION PATH
    let result;
    if (isMultiFile || classification.mode === 'autonomous') {
      // Force mode to 'autonomous' so the frontend renders the plan-steps UI
      // instead of the fast-path pipeline (which would get stuck on "Patch Applied")
      task.mode = 'autonomous';
      perf.setMode('autonomous');
      emitTaskUpdate(io, task); // Re-emit with corrected mode before starting
      result = await runMultiFileGeneration(task, io, perf, editorContext);
    } else if (classification.mode === 'smart') {
      result = await runSmartPath(task, io, perf, classification, editorContext);
    } else {
      if (io) io.emit('agent:fast_path', { taskId: String(task._id) });
      result = await runFastPath(task, io, perf, classification, editorContext);
    }

    if (isCancelled(taskId)) {
      task.state = 'CANCELLED';
      task.activeTaskText = 'Operation cancelled by user';
      await saveTask(task);
      emitTaskUpdate(io, task);
      return;
    }

    // 3. COMPLETE TASK
    // Note: runMultiFileGeneration already emits agent:completed and saves to DB.
    // For fast/smart paths we still need to emit it here.
    const isMultiFilePath = isMultiFile || task.mode === 'autonomous';

    task.state = 'COMPLETED';
    task.activeTaskText = `Completed in ${((Date.now() - perf.startedAt) / 1000).toFixed(1)}s`;
    task.summary = result.summary || task.summary;
    task.plan = result.plan || task.plan;
    task.filesChanged = result.filesChanged || task.filesChanged;
    task.terminalOutput = result.terminalOutput || [];

    task.logs.push({
      timestamp: new Date(),
      text: `Done. Modified ${task.filesChanged.length} file(s) in ${((Date.now() - perf.startedAt) / 1000).toFixed(1)}s`,
    });

    task.messages.push({
      role: 'agent',
      message: task.summary || `Task completed! Modified ${task.filesChanged.length} file(s).`,
      timestamp: new Date(),
    });

    await saveTask(task);

    perf.logSummary();
    const perfReport = perf.report();

    // Multi-file engine already emitted agent:completed internally (with DB save).
    // Only emit again for fast/smart paths to avoid duplicate toasts on the frontend.
    if (!isMultiFilePath) {
      emitTaskUpdate(io, task, 'agent:completed');
    }
    if (io) {
      io.emit('agent:perf', perfReport);
    }

  } catch (err) {
    console.error('[Agent] Execution error:', err);
    task.state = 'FAILED';
    task.errorDetails = err.message;
    task.activeTaskText = 'Failed: ' + err.message;
    task.logs.push({ timestamp: new Date(), text: 'Error: ' + err.message });
    await saveTask(task);
    emitTaskUpdate(io, task, 'agent:status');
    if (io) io.emit('agent:perf', perf.report());
  } finally {
    clearWatchdog(taskId);
    activeExecutions.delete(String(taskId));
  }
}

// ------------------------------------------------------------------------------
// Control Handlers
// ------------------------------------------------------------------------------

async function stopTask(taskId, io) {
  const ex = activeExecutions.get(String(taskId));
  if (ex) ex.cancelled = true;
  clearWatchdog(taskId);

  const task = await AgentTask.findById(taskId);
  if (task) {
    task.state = 'CANCELLED';
    task.activeTaskText = 'Cancelled by user';
    task.logs.push({ timestamp: new Date(), text: 'Manually stopped' });
    await saveTask(task);
    emitTaskUpdate(io, task);
  }
  return task;
}

async function pauseTask(taskId, io) {
  const ex = activeExecutions.get(String(taskId));
  if (ex) ex.cancelled = true;
  clearWatchdog(taskId);

  const task = await AgentTask.findById(taskId);
  if (task) {
    task.state = 'PAUSED';
    task.activeTaskText = 'Paused';
    task.logs.push({ timestamp: new Date(), text: 'Paused by user' });
    await saveTask(task);
    emitTaskUpdate(io, task);
  }
  return task;
}

async function resumeTask(taskId, io) {
  const task = await AgentTask.findById(taskId);
  if (task) {
    task.state = 'EXECUTING';
    task.logs.push({ timestamp: new Date(), text: 'Resuming task execution' });
    await saveTask(task);
    emitTaskUpdate(io, task);
    runAgentLoop(taskId, io);
  }
  return task;
}

async function acceptTaskChanges(taskId, filePath, io) {
  const task = await AgentTask.findById(taskId);
  if (!task) return null;

  if (filePath) {
    const f = (task.filesChanged || []).find(f => f.path === filePath);
    if (f) f.applied = true;
  } else {
    (task.filesChanged || []).forEach(f => { f.applied = true; });
  }

  task.logs.push({ timestamp: new Date(), text: 'Accepted changes: ' + (filePath || 'all files') });
  await saveTask(task);
  emitTaskUpdate(io, task);
  return task;
}

async function rejectTaskChanges(taskId, filePath, io) {
  const task = await AgentTask.findById(taskId);
  if (!task) return null;
  const pid = String(task.projectId);

  if (filePath) {
    const f = (task.filesChanged || []).find(f => f.path === filePath);
    if (f && f.originalContent !== undefined) {
      await agentTools.writeFile(pid, filePath, f.originalContent);
      cache.setFile(pid, filePath, f.originalContent);
      f.applied = false;
      if (io) io.emit('workspace:fs-change', { projectId: pid, event: 'change', path: filePath });
    }
  } else if (task.checkpoints && task.checkpoints.length > 0) {
    await checkpoints.restoreCheckpoint(task, task.checkpoints[0].checkpointId, io);
  }

  task.logs.push({ timestamp: new Date(), text: 'Rejected changes: ' + (filePath || 'all files') });
  await saveTask(task);
  emitTaskUpdate(io, task);
  return task;
}

module.exports = {
  runAgentLoop,
  stopTask,
  pauseTask,
  resumeTask,
  acceptTaskChanges,
  rejectTaskChanges,
  emitTaskUpdate,
};
