/**
 * agent.fast_path.js - Autonomous Workspace Coding Agent.
 *
 * Capabilities:
 * - Operates across the ENTIRE workspace/folders.
 * - Creates new directories and multi-file components (e.g. src/components/Counter/Counter.jsx + Counter.css).
 * - Modifies existing files (e.g. src/App.jsx) and connects imports automatically.
 * - Deletes, renames, and moves files when requested.
 * - Sub-5-second execution with 1 direct structured LLM call.
 */

const agentTools = require('./agent.tools');
const aiService = require('../services/ai.service');
const cache = require('./agent.cache');
const { buildWorkspaceContext } = require('./agent.discovery');
const { applyPatches, validateSyntax, createSimpleDiff } = require('./agent.patcher');
const checkpoints = require('./agent.checkpoints');

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
}

function parseWorkspaceResponse(raw) {
  let cleaned = (raw || '').trim();
  const jm = cleaned.match(/```json\s*([\s\S]*?)\s*```/);
  if (jm) cleaned = jm[1].trim();
  else {
    const gm = cleaned.match(/```\s*([\s\S]*?)\s*```/);
    if (gm) cleaned = gm[1].trim();
  }

  // 1. Direct parse attempt
  let parsed = tryParseJson(cleaned);

  // 2. Substring between first and last brace
  if (!parsed) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      parsed = tryParseJson(cleaned.substring(firstBrace, lastBrace + 1));
    }
  }

  // 3. Auto-close truncated JSON attempts
  if (!parsed) {
    const attempts = [
      cleaned + '"} ] }',
      cleaned + '" } ] }',
      cleaned + ' } ] }',
      cleaned + ' ] }',
      cleaned + ' }',
    ];
    for (const att of attempts) {
      parsed = tryParseJson(att);
      if (parsed) break;
    }
  }

  if (parsed && typeof parsed === 'object') {
    const ops = Array.isArray(parsed.operations)
      ? parsed.operations
      : (Array.isArray(parsed.files_to_change) ? parsed.files_to_change : []);

    return {
      summary: parsed.summary || 'Workspace changes applied',
      plan: Array.isArray(parsed.plan) ? parsed.plan : [],
      operations: ops,
    };
  }

  // 4. Regex extraction fallback for individual operations
  console.warn('[WorkspaceAgent] Attempting resilient regex extraction from raw output...');
  const operations = [];
  const fileBlocks = cleaned.split(/(?=\{\s*"action"|\{\s*"path")/);

  for (const block of fileBlocks) {
    const fb = block.indexOf('{');
    const lb = block.lastIndexOf('}');
    if (fb !== -1 && lb !== -1 && lb > fb) {
      const op = tryParseJson(block.substring(fb, lb + 1));
      if (op && (op.path || op.action)) {
        operations.push(op);
      }
    }
  }

  return {
    summary: 'Applied updates',
    plan: operations.map((op, i) => ({
      id: i + 1,
      text: `Update ${op.path || 'file'}`,
      status: 'completed',
      filesInvolved: [op.path].filter(Boolean),
    })),
    operations,
  };
}

/**
 * Execute Workspace-level Autonomous Task
 */
async function runFastPath(task, io, perf, classification, editorContext = {}) {
  const pid = String(task.projectId);
  const taskId = String(task._id);

  const emitProgress = (text, step = null) => {
    task.activeTaskText = text;
    if (io) {
      io.emit('agent:status', {
        taskId,
        projectId: pid,
        state: 'EXECUTING',
        mode: task.mode || 'fast',
        activeTaskText: text,
        step,
      });
    }
  };

  // 1. ANALYZE WORKSPACE CONTEXT (Files, Folders, Active Focus)
  emitProgress('Analyzing workspace structure...', 'analyzing_workspace');
  const workspaceContext = await buildWorkspaceContext(pid, task.prompt, editorContext, perf);

  // 2. LLM WORKSPACE ARCHITECT & CODE GENERATION
  if (perf) {
    perf.start('llm');
    perf.inc('llmCalls');
  }
  emitProgress('Determining required files & generating code...', 'generating_code');

  const systemPrompt = `You are DevCollab Professional Autonomous AI Coding Agent.
You behave like an elite staff software engineer:
Understand existing code -> Modify cleanly -> PRESERVE all existing working functionality -> Wire and verify.

Respond ONLY with valid JSON matching this schema:
{
  "summary": "Clear summary of changes and files modified",
  "plan": [
    { "id": 1, "text": "Create/Update Component", "status": "completed", "filesInvolved": ["src/components/Navbar.jsx"] }
  ],
  "operations": [
    {
      "action": "create_file" | "modify_file" | "create_directory" | "delete_file" | "rename_file",
      "path": "src/components/Example.jsx",
      "content": "Complete modern component code..."
    }
  ]
}

CRITICAL ENGINEERING RULES:
1. PRESERVE EXISTING FUNCTIONALITY (ZERO REGRESSIONS):
   - NEVER drop or delete existing components (like Navbar, Header, Sidebar, Footer, or already created pages).
   - If the user asks for a new page (e.g. "Create Home Page" when "Product Page" already exists), KEEP the Product Page, KEEP the Navbar, and wire navigation/state (e.g., activeTab state or router) in App.jsx so both pages are accessible.
   - If the user asks to fix an issue (e.g. "navbar navigation is not working"), DIAGNOSE and FIX the navigation logic (e.g. missing onClick handler, active page state, or route links) — NEVER REMOVE OR STRIP THE NAVBAR!

2. CODE INTEGRITY & COMPLETENESS:
   - Provide COMPLETE, runnable code for each file. Never use placeholders like "// ... rest of code" or "...".
   - Always ensure imports and exports are correctly connected across files.
   - Maintain consistent styling (Tailwind / CSS), color palette, and design aesthetic.

3. MINIMAL SURGICAL MODIFICATIONS:
   - Make only the necessary changes to fulfill the user request.
   - Do not randomly rewrite unrelated parts of existing files.`;

  const userPrompt = `USER REQUEST: "${task.prompt}"

${workspaceContext}

Provide the complete JSON plan and operations now.`;

  let llmResponse = '';
  try {
    llmResponse = await aiService.generateWithTools(systemPrompt, userPrompt);
  } catch (err) {
    if (perf) perf.end('llm');
    throw new Error('AI Generation failed: ' + err.message);
  }
  if (perf) perf.end('llm');

  // 3. EXECUTE WORKSPACE OPERATIONS
  if (perf) perf.start('patch');
  emitProgress('Applying workspace modifications...', 'applying_operations');

  const parsed = parseWorkspaceResponse(llmResponse);
  const summary = parsed.summary || 'Workspace changes completed';
  const operations = parsed.operations || [];

  const filesChanged = [];
  const pathsToSnapshot = operations
    .filter(op => op.path || op.oldPath)
    .map(op => op.path || op.oldPath);

  // Snapshot before modifying
  if (pathsToSnapshot.length > 0) {
    await checkpoints.createCheckpoint(task, `Before: ${task.prompt.slice(0, 30)}`, pathsToSnapshot);
  }

  for (const op of operations) {
    const action = op.action || (op.status === 'A' ? 'create_file' : 'modify_file');
    const filePath = op.path;

    if (action === 'create_directory' && filePath) {
      await agentTools.createDirectory(pid, filePath);
      if (io) io.emit('workspace:fs-change', { projectId: pid, event: 'addDir', path: filePath });
      continue;
    }

    if (action === 'delete_file' && filePath) {
      const origRes = await agentTools.readFile(pid, filePath);
      const origContent = origRes.success ? origRes.content : '';
      await agentTools.deleteFile(pid, filePath);
      filesChanged.push({
        path: filePath,
        status: 'D',
        originalContent: origContent,
        newContent: '',
        explanation: `Deleted ${filePath}`,
        diff: createSimpleDiff(origContent, ''),
        applied: true,
      });
      if (io) io.emit('workspace:fs-change', { projectId: pid, event: 'unlink', path: filePath });
      continue;
    }

    if (action === 'rename_file' && op.oldPath && op.newPath) {
      await agentTools.renameFile(pid, op.oldPath, op.newPath);
      if (io) io.emit('workspace:fs-change', { projectId: pid, event: 'change', path: op.newPath });
      continue;
    }

    if ((action === 'create_file' || action === 'modify_file' || action === 'update_file') && filePath) {
      const origRes = await agentTools.readFile(pid, filePath);
      const originalContent = origRes.success ? origRes.content : '';

      let newContent = op.content || '';
      if (newContent.startsWith('```')) {
        newContent = newContent.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '');
      }

      if (action === 'create_file' && !origRes.success) {
        await agentTools.createFile(pid, filePath, newContent);
      } else {
        await agentTools.writeFile(pid, filePath, newContent);
      }

      if (perf) perf.inc('filesWritten');

      if (io) {
        io.emit('workspace:fs-change', {
          projectId: pid,
          event: origRes.success ? 'change' : 'add',
          path: filePath,
        });
      }

      filesChanged.push({
        path: filePath,
        status: origRes.success ? 'M' : 'A',
        originalContent,
        newContent,
        explanation: summary,
        diff: createSimpleDiff(originalContent, newContent),
        applied: true,
      });
    }
  }
  if (perf) perf.end('patch');

  // 4. SYNTAX VALIDATION
  if (perf) perf.start('validation');
  for (const f of filesChanged) {
    if (f.newContent) {
      validateSyntax(f.path, f.newContent);
    }
  }
  if (perf) perf.end('validation');

  task.summary = summary;
  task.plan = parsed.plan.length > 0 ? parsed.plan : filesChanged.map((f, i) => ({
    id: i + 1,
    text: `${f.status === 'A' ? 'Created' : 'Updated'} ${f.path}`,
    status: 'completed',
    filesInvolved: [f.path],
  }));
  task.filesChanged = filesChanged;

  emitProgress(`Completed: Modified ${filesChanged.length} file(s)`, 'completed');

  return {
    summary,
    plan: task.plan,
    filesChanged,
    terminalOutput: [],
  };
}

module.exports = {
  runFastPath,
};
