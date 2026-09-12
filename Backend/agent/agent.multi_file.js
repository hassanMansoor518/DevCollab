/**
 * agent.multi_file.js - Autonomous Multi-File Project Generation & Execution Engine.
 *
 * Implements:
 * 1. Architecture Planning & Dependency-Aware Batching
 * 2. Iterative Multi-Batch Execution Loop
 * 3. Transactional File Creation & Verification
 * 4. Post-Generation Disk Auditing & Automatic Missing File Recovery
 * 5. Resumable Generation (skips existing verified files)
 * 6. Single Source of Truth Completion Guarantee (Never stuck in Loading)
 */

const agentTools = require('./agent.tools');
const aiService = require('../services/ai.service');
const cache = require('./agent.cache');
const checkpoints = require('./agent.checkpoints');
const { validateSyntax, createSimpleDiff } = require('./agent.patcher');
const { buildWorkspaceContext, getWorkspaceFileList } = require('./agent.discovery');
const workspaceFs = require('../services/workspaceFs.service');

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
}

function parseJsonFromLlm(raw) {
  let cleaned = (raw || '').trim();
  const jm = cleaned.match(/```json\s*([\s\S]*?)\s*```/);
  if (jm) cleaned = jm[1].trim();
  else {
    const gm = cleaned.match(/```\s*([\s\S]*?)\s*```/);
    if (gm) cleaned = gm[1].trim();
  }

  // 1. Direct parse
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

  // 4. Regex extraction fallback
  if (!parsed) {
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
    if (operations.length > 0) {
      parsed = { operations };
    }
  }

  return parsed || { operations: [] };
}

/**
 * Step 1: Generate Complete Project Architecture & Batching Plan
 */
async function generateProjectPlan(task, prompt, workspaceContext, perf) {
  if (perf) {
    perf.start('planning');
    perf.inc('llmCalls');
  }

  const systemPrompt = `You are an elite Software Architect.
Your task is to plan the complete, production-ready file architecture for a web application based on the user's prompt.
Divide all required files into 2 to 5 logical sequential batches (2 to 4 files per batch).

Respond ONLY with valid JSON matching this schema:
{
  "summary": "High-level summary of the architecture and project",
  "totalFiles": 8,
  "batches": [
    {
      "batchNumber": 1,
      "name": "State & Mock Data",
      "files": [
        { "path": "src/context/AppContext.jsx", "description": "Global state / cart / theme context" },
        { "path": "src/data/mockData.js", "description": "Mock data and models" }
      ]
    },
    {
      "batchNumber": 2,
      "name": "Layout & Shared Components",
      "files": [
        { "path": "src/components/Navbar.jsx", "description": "Navigation bar with links and active state" },
        { "path": "src/components/Footer.jsx", "description": "Footer component" },
        { "path": "src/components/ProductCard.jsx", "description": "Product Card component" }
      ]
    },
    {
      "batchNumber": 3,
      "name": "Pages",
      "files": [
        { "path": "src/pages/Home.jsx", "description": "Homepage with hero and featured items" },
        { "path": "src/pages/Products.jsx", "description": "Product listing page" },
        { "path": "src/pages/Cart.jsx", "description": "Cart and checkout page" }
      ]
    },
    {
      "batchNumber": 4,
      "name": "Integration & Entry",
      "files": [
        { "path": "src/App.jsx", "description": "Main App with Router/navigation wiring" },
        { "path": "src/index.css", "description": "Global modern styles" }
      ]
    }
  ]
}

CRITICAL RULES:
1. Ensure the plan includes ALL components, pages, navigation, and state requested by the user.
2. Keep each batch focused on 2 to 4 related files.
3. Every file path must be relative to workspace root (e.g. "src/components/Navbar.jsx").`;

  const userPrompt = `USER REQUEST: "${prompt}"

EXISTING WORKSPACE CONTEXT:
${workspaceContext}

Generate the complete architecture and batching plan now.`;

  let raw = '';
  try {
    raw = await aiService.generateWithTools(systemPrompt, userPrompt);
  } catch (err) {
    if (perf) perf.end('planning');
    throw new Error('Project planning failed: ' + err.message);
  }
  if (perf) perf.end('planning');

  const parsed = parseJsonFromLlm(raw);
  const batches = Array.isArray(parsed.batches) && parsed.batches.length > 0 ? parsed.batches : [
    {
      batchNumber: 1,
      name: "Core Components & Pages",
      files: [
        { "path": "src/components/Navbar.jsx", "description": "Navigation bar" },
        { "path": "src/pages/Home.jsx", "description": "Home page" },
        { "path": "src/App.jsx", "description": "Main App" }
      ]
    }
  ];

  return {
    summary: parsed.summary || 'Project generation plan created',
    totalFiles: parsed.totalFiles || batches.reduce((acc, b) => acc + (b.files?.length || 0), 0),
    batches,
  };
}

/**
 * Step 2: Generate Code for a Single Batch of Files
 */
async function generateBatchFiles(projectId, prompt, batch, existingSignatures, perf) {
  const pid = String(projectId);
  if (perf) {
    perf.start('batch-llm');
    perf.inc('llmCalls');
  }

  const fileListPrompt = batch.files.map(f => `- ${f.path}: ${f.description}`).join('\n');

  const systemPrompt = `You are DevCollab Professional AI Coding Agent.
Generate complete, production-ready, clean source code for ONLY the files requested in this batch.

Respond ONLY with valid JSON matching this schema:
{
  "operations": [
    {
      "action": "create_file",
      "path": "src/components/Example.jsx",
      "content": "Full source code here..."
    }
  ]
}

CRITICAL RULES:
1. Provide COMPLETE, RUNNABLE code for every file listed. NEVER use placeholders or ellipsis ("// ... rest of code").
2. Connect imports and exports properly to fit with the rest of the application.
3. Maintain modern, sleek visual aesthetics with Tailwind / CSS.
4. Ensure components are fully interactive with state, click handlers, and responsive styling.`;

  const userPrompt = `PROJECT GOAL: "${prompt}"

CURRENT BATCH: Batch ${batch.batchNumber} - ${batch.name}
FILES TO GENERATE IN THIS BATCH:
${fileListPrompt}

PREVIOUSLY CREATED MODULES & CONTEXT:
${existingSignatures || '(Starting new project modules)'}

Provide the complete JSON with full source code for each file in this batch.`;

  let raw = '';
  try {
    raw = await aiService.generateWithTools(systemPrompt, userPrompt);
  } catch (err) {
    if (perf) perf.end('batch-llm');
    throw new Error(`Batch ${batch.batchNumber} generation failed: ` + err.message);
  }
  if (perf) perf.end('batch-llm');

  const parsed = parseJsonFromLlm(raw);
  const operations = Array.isArray(parsed.operations)
    ? parsed.operations
    : (Array.isArray(parsed.files_to_change) ? parsed.files_to_change : []);

  return operations;
}

/**
 * Step 3: Transactional File Write & Verification
 */
async function writeAndVerifyFile(projectId, filePath, content, perf) {
  const pid = String(projectId);
  if (!filePath || typeof filePath !== 'string') {
    return { success: false, error: 'Invalid file path' };
  }

  let cleanContent = content || '';
  if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '');
  }

  try {
    // 1. Write to disk
    workspaceFs.writeWorkspaceFile(pid, filePath, cleanContent);
    cache.setFile(pid, filePath, cleanContent);
    cache.invalidateIndex(pid);

    // 2. Immediate readback verification from disk
    const verifiedContent = workspaceFs.readWorkspaceFile(pid, filePath);
    if (verifiedContent === null) {
      throw new Error(`Verification failed: ${filePath} could not be read back from disk.`);
    }

    if (perf) perf.inc('filesWritten');

    return {
      success: true,
      path: filePath,
      content: verifiedContent,
      size: Buffer.byteLength(verifiedContent, 'utf8'),
    };
  } catch (err) {
    console.error(`[MultiFileAgent] Write error for ${filePath}:`, err.message);
    return { success: false, path: filePath, error: err.message };
  }
}

/**
 * Step 4: Missing File Recovery Pass
 */
async function recoverMissingFiles(projectId, prompt, missingFiles, perf) {
  if (!missingFiles || missingFiles.length === 0) return [];
  const pid = String(projectId);

  if (perf) {
    perf.start('recovery-llm');
    perf.inc('llmCalls');
  }

  const missingListPrompt = missingFiles.map(f => `- ${f.path}: ${f.description || 'Required project file'}`).join('\n');

  const systemPrompt = `You are DevCollab Professional AI Coding Agent.
The following planned files are missing on disk. Generate complete, high quality, production-ready code for each missing file.

Respond ONLY with valid JSON:
{
  "operations": [
    {
      "action": "create_file",
      "path": "src/pages/Cart.jsx",
      "content": "Full complete source code..."
    }
  ]
}`;

  const userPrompt = `PROJECT GOAL: "${prompt}"

MISSING FILES TO GENERATE:
${missingListPrompt}

Provide the complete JSON implementation for all missing files.`;

  let raw = '';
  try {
    raw = await aiService.generateWithTools(systemPrompt, userPrompt);
  } catch (err) {
    if (perf) perf.end('recovery-llm');
    console.warn('[MultiFileAgent] Recovery pass generation warning:', err.message);
    return [];
  }
  if (perf) perf.end('recovery-llm');

  const parsed = parseJsonFromLlm(raw);
  return Array.isArray(parsed.operations) ? parsed.operations : [];
}

/**
 * Main Autonomous Multi-File Project Generation Runner
 */
async function runMultiFileGeneration(task, io, perf, editorContext = {}) {
  const pid = String(task.projectId);
  const taskId = String(task._id);

  const emitProgress = (activeText, stepData = {}) => {
    task.activeTaskText = activeText;
    if (io) {
      io.emit('agent:status', {
        taskId,
        projectId: pid,
        state: task.state || 'EXECUTING',
        mode: task.mode || 'autonomous',
        activeTaskText: activeText,
        plan: task.plan || [],
        filesChanged: task.filesChanged || [],
        ...stepData,
      });
    }
  };

  // 1. CONTEXT DISCOVERY & SNAPSHOT
  task.state = 'ANALYZING';
  emitProgress('Scanning workspace architecture & existing files...', { step: 'discovery' });
  const workspaceContext = await buildWorkspaceContext(pid, task.prompt, editorContext, perf);

  // 2. PROJECT ARCHITECTURE PLANNING
  task.state = 'PLANNING';
  emitProgress('Architecting project blueprint & generation batches...', { step: 'planning' });
  const planData = await generateProjectPlan(task, task.prompt, workspaceContext, perf);

  const totalFilesCount = planData.totalFiles || 8;
  const allPlannedFiles = [];
  const planItems = [];

  let stepIdx = 1;
  for (const batch of planData.batches) {
    for (const file of (batch.files || [])) {
      allPlannedFiles.push(file);
      planItems.push({
        id: stepIdx++,
        text: `Create ${file.path} (${file.description || batch.name})`,
        status: 'pending',
        filesInvolved: [file.path],
      });
    }
  }

  task.plan = planItems;
  task.summary = planData.summary;
  task.state = 'EXECUTING';
  emitProgress(`Plan established: ${allPlannedFiles.length} files across ${planData.batches.length} batches`, {
    step: 'plan_established',
    totalFiles: allPlannedFiles.length,
  });

  // Snapshot before modifying
  const initialFiles = await getWorkspaceFileList(pid);
  await checkpoints.createCheckpoint(task, `Before: ${task.prompt.slice(0, 30)}`, initialFiles.slice(0, 10));

  // 3. ITERATIVE BATCH EXECUTION LOOP
  const filesChanged = [];
  const writtenPaths = new Set();
  let generatedSignatures = '';

  for (let bIdx = 0; bIdx < planData.batches.length; bIdx++) {
    const batch = planData.batches[bIdx];
    emitProgress(`Executing Batch ${bIdx + 1}/${planData.batches.length}: ${batch.name}...`, {
      step: 'executing_batch',
      batchNumber: bIdx + 1,
      totalBatches: planData.batches.length,
    });

    // Check if files in this batch already exist and have content
    const filesToGenerate = [];
    for (const f of batch.files) {
      const existing = workspaceFs.readWorkspaceFile(pid, f.path);
      if (existing && existing.length > 50) {
        // Already exists with content, skip regeneration
        console.log(`[MultiFileAgent] File already exists: ${f.path} (${existing.length} bytes), skipping.`);
        writtenPaths.add(f.path);
        const planItem = task.plan.find(p => p.filesInvolved && p.filesInvolved.includes(f.path));
        if (planItem) planItem.status = 'completed';
      } else {
        filesToGenerate.push(f);
      }
    }

    if (filesToGenerate.length > 0) {
      const batchBatch = { ...batch, files: filesToGenerate };
      const operations = await generateBatchFiles(pid, task.prompt, batchBatch, generatedSignatures, perf);

      for (const op of operations) {
        const filePath = op.path;
        if (!filePath) continue;

        if (io) {
          io.emit('agent:file_started', { taskId, projectId: pid, path: filePath });
        }

        const origContent = workspaceFs.readWorkspaceFile(pid, filePath) || '';
        const writeResult = await writeAndVerifyFile(pid, filePath, op.content, perf);

        if (writeResult.success) {
          writtenPaths.add(filePath);
          const planItem = task.plan.find(p => p.filesInvolved && p.filesInvolved.includes(filePath));
          if (planItem) planItem.status = 'completed';

          filesChanged.push({
            path: filePath,
            status: origContent ? 'M' : 'A',
            originalContent: origContent,
            newContent: writeResult.content,
            explanation: `Created in ${batch.name}`,
            diff: createSimpleDiff(origContent, writeResult.content),
            applied: true,
          });

          // Accumulate module signatures for next batches
          const firstFewLines = writeResult.content.split('\n').slice(0, 15).join('\n');
          generatedSignatures += `\n--- ${filePath} ---\n${firstFewLines}\n`;

          if (io) {
            io.emit('workspace:fs-change', { projectId: pid, event: 'add', path: filePath });
            io.emit('agent:file_completed', { taskId, projectId: pid, path: filePath, status: 'A' });
            io.emit('agent:progress', {
              completed: writtenPaths.size,
              total: allPlannedFiles.length,
              currentFile: filePath,
            });
          }
        }
      }
    }

    // Incremental checkpoint and DB save
    task.filesChanged = filesChanged;
    await task.save().catch(() => {});
  }

  // 4. DISK AUDIT & AUTOMATIC MISSING FILE RECOVERY PASS
  task.state = 'VERIFYING';
  emitProgress('Auditing workspace disk for all planned files...', { step: 'disk_audit' });

  const missingFiles = [];
  for (const pf of allPlannedFiles) {
    const diskContent = workspaceFs.readWorkspaceFile(pid, pf.path);
    if (!diskContent || diskContent.trim().length < 20) {
      missingFiles.push(pf);
    }
  }

  if (missingFiles.length > 0) {
    emitProgress(`Recovering ${missingFiles.length} missing file(s)...`, { step: 'recovery' });
    const recoveryOps = await recoverMissingFiles(pid, task.prompt, missingFiles, perf);

    for (const op of recoveryOps) {
      if (!op.path) continue;
      const origContent = workspaceFs.readWorkspaceFile(pid, op.path) || '';
      const writeResult = await writeAndVerifyFile(pid, op.path, op.content, perf);

      if (writeResult.success) {
        writtenPaths.add(op.path);
        const planItem = task.plan.find(p => p.filesInvolved && p.filesInvolved.includes(op.path));
        if (planItem) planItem.status = 'completed';

        filesChanged.push({
          path: op.path,
          status: origContent ? 'M' : 'A',
          originalContent: origContent,
          newContent: writeResult.content,
          explanation: 'Recovered in verification pass',
          diff: createSimpleDiff(origContent, writeResult.content),
          applied: true,
        });

        if (io) {
          io.emit('workspace:fs-change', { projectId: pid, event: 'add', path: op.path });
          io.emit('agent:file_completed', { taskId, projectId: pid, path: op.path, status: 'A' });
        }
      }
    }
  }

  // 5. SYNTAX VALIDATION
  if (perf) perf.start('validation');
  for (const f of filesChanged) {
    if (f.newContent) {
      validateSyntax(f.path, f.newContent);
    }
  }
  if (perf) perf.end('validation');

  // 6. SINGLE SOURCE OF TRUTH COMPLETION
  task.summary = planData.summary || `Successfully created ${writtenPaths.size} project files.`;
  task.filesChanged = filesChanged;
  task.state = 'COMPLETED';
  task.activeTaskText = `Completed: ${writtenPaths.size} files generated successfully.`;

  // Persist COMPLETED state to DB NOW — so the polling fallback endpoint
  // returns COMPLETED even if the orchestrator emit is dropped.
  await task.save().catch(err => console.warn('[MultiFileAgent] Final save warning:', err.message));

  // Emit agent:completed (not just agent:status) so the frontend's handleCompleted
  // fires immediately: sets isLoading=false, shows toast, activates perf panel.
  if (io) {
    io.emit('agent:completed', {
      taskId,
      projectId: pid,
      state: 'COMPLETED',
      mode: task.mode || 'autonomous',
      activeTaskText: task.activeTaskText,
      summary: task.summary,
      plan: task.plan || [],
      filesChanged: task.filesChanged || [],
      totalGenerated: writtenPaths.size,
    });
  }

  return {
    summary: task.summary,
    plan: task.plan,
    filesChanged: task.filesChanged,
    terminalOutput: [],
  };
}

module.exports = {
  runMultiFileGeneration,
  generateProjectPlan,
  generateBatchFiles,
  writeAndVerifyFile,
};
