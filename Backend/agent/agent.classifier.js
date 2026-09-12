/**
 * agent.classifier.js - 3-Tier Task Classifier. NO LLM call.
 *
 * Classifies user prompt into:
 * - 'fast' (TRIVIAL): 1 fast LLM call (target 2-8s). Single-file change, UI, style, rename, text, prop, bug fix.
 * - 'smart' (MEDIUM): Targeted reasoning + 1-2 calls (target 10-25s). 2-5 files, add component/route, refactor.
 * - 'autonomous' (COMPLEX): Full planning loop (target 30-75s). Auth, full system, architecture, database design.
 */

// 1. TRIVIAL (Fast Path) patterns
const TRIVIAL_PATTERNS = [
  // Color, style, CSS, Tailwind, UI appearance
  { re: /(change|set|update|make|toggle|switch)\s+.*(color|background|bg|font|style|border|padding|margin|radius|shadow|theme)/i, op: 'ui_style' },
  { re: /if\s+.*(is\s+on|is\s+off|is\s+active|checked|true|false|open|closed).*change/i, op: 'conditional_ui' },
  { re: /(when|if)\s+.*(color|background|style|text|class|classname)/i, op: 'conditional_ui' },
  { re: /make\s+(the\s+)?(background|color|button|text|heading|header|div)\s+/i, op: 'ui_style' },
  { re: /(yellow|red|blue|green|purple|black|white|gray|orange|pink|teal|cyan)/i, op: 'color_change' },

  // Text, labels, titles, strings, renaming
  { re: /rename\s+(the\s+)?(title|label|text|button|header|name|variable|function|prop|component)/i, op: 'rename_text' },
  { re: /(change|update|replace|set)\s+(the\s+)?(title|label|heading|text|name|placeholder|caption)\s+(from|to|with)/i, op: 'change_text' },
  { re: /change\s+(the\s+)?(title|label|heading|text|name|string|caption)/i, op: 'change_text' },

  // Add simple UI elements (button, input, toggle, text)
  { re: /add\s+(a\s+)?(new\s+)?(reset\s+)?(button|input|link|icon|heading|paragraph|span|div|badge|label)/i, op: 'add_element' },
  { re: /add\s+(a\s+)?(toggle|switch|checkbox|radio)/i, op: 'add_element' },

  // Simple state or prop changes
  { re: /add\s+(a\s+)?(state|usestate|handler|onclick|onchange|event|prop|property)/i, op: 'simple_state' },
  { re: /(toggle|switch|increment|decrement|reset)\s+(the\s+)?(state|count|value|status|flag|bulb)/i, op: 'simple_state' },

  // Simple fixes, typos, imports, comments
  { re: /fix\s+(a\s+)?(the\s+)?(typo|import|syntax|variable|missing|undefined|null|error|bug)/i, op: 'simple_fix' },
  { re: /add\s+(an?\s+)?import/i, op: 'add_import' },
  { re: /remove\s+(the\s+)?(console\.log|log|debug|comment|unused)/i, op: 'clean_code' },
  { re: /add\s+(a\s+)?(comment|console\.log|log|debug)/i, op: 'add_log' },

  // File creation (single file)
  { re: /create\s+(a\s+)?(new\s+)?(file|component|util|helper|style|css)\s+[\w/\-.]+/i, op: 'create_single_file' },
  { re: /^[\w/\-.]+\.(js|jsx|ts|tsx|css|json|html|md)$/i, op: 'single_file_target' },

  // Single file explanations
  { re: /^(explain|describe|what\s+does|read|open|show\s+me)\s/i, op: 'read_explain' },
];

// 2. COMPLEX (Autonomous Path) patterns
const COMPLEX_PATTERNS = [
  { re: /(complete|full|entire)\s+(auth|authentication|login|signup|user)\s+(system|flow|feature)/i, op: 'auth_system' },
  { re: /authentication\s+system|auth\s+system|jwt\s+auth|oauth/i, op: 'auth_system' },
  { re: /(build|create|implement)\s+(a\s+)?(complete|full|entire|whole)\s+(feature|app|application|platform|dashboard|system)/i, op: 'full_feature' },
  { re: /refactor\s+(the\s+)?(entire|whole|all|codebase|project|architecture)/i, op: 'refactor_all' },
  { re: /migrate\s+(the\s+)?(database|project|codebase|from|to)\s+/i, op: 'migration' },
  { re: /database\s+(schema|migration|design|setup)\s+and/i, op: 'db_design' },
  { re: /deploy|docker|kubernetes|ci\/cd|pipeline/i, op: 'devops' },
  { re: /(websocket|socket\.io|webrtc)\s+(system|infrastructure|server\s+and\s+client)/i, op: 'realtime_system' },
];

// 3. MEDIUM (Smart Path) patterns
const SMART_PATTERNS = [
  { re: /add\s+(a\s+)?(new\s+)?(component|page|view|route|api|endpoint|service|hook)\s+and/i, op: 'add_component_multi' },
  { re: /connect\s+(the\s+)?(frontend|ui)\s+(to|with)\s+(the\s+)?(api|backend|database)/i, op: 'api_integration' },
  { re: /integrate\s+(the\s+)?(api|service|endpoint|backend)/i, op: 'api_integration' },
  { re: /refactor\s+(this|the)\s+(component|service|module|file)/i, op: 'refactor_component' },
  { re: /generate\s+(unit\s+)?tests?|write\s+(unit\s+)?tests?/i, op: 'generate_tests' },
  { re: /fix\s+(the\s+)?(multi-file|integration|api|sync)\s+bug/i, op: 'multifile_bug' },
  { re: /add\s+pagination|add\s+filtering|add\s+search\s+functionality/i, op: 'feature_component' },
];

/**
 * Classify user prompt and determine execution mode.
 * @param {string} prompt
 * @param {object} options - { modeOverride, activeFile, selectedCode }
 * @returns {{ mode: 'fast'|'smart'|'autonomous', op: string, confidence: number, targetHints: string[] }}
 */
function classify(prompt, options = {}) {
  // If user explicitly selected an execution mode, respect it directly!
  if (options.modeOverride && ['fast', 'smart', 'autonomous'].includes(options.modeOverride)) {
    return {
      mode: options.modeOverride,
      op: 'user_override',
      confidence: 1.0,
      targetHints: extractTargetHints(prompt),
    };
  }

  if (!prompt || typeof prompt !== 'string') {
    return { mode: 'fast', op: 'default_fast', confidence: 0.8, targetHints: [] };
  }

  const p = prompt.trim();
  const lp = p.toLowerCase();
  const targetHints = extractTargetHints(p);

  // 1. Check Complex Patterns first
  for (const pat of COMPLEX_PATTERNS) {
    if (pat.re.test(p)) {
      return { mode: 'autonomous', op: pat.op, confidence: 0.95, targetHints };
    }
  }

  // 2. Check Trivial / Fast Patterns next (highest priority for daily coding actions)
  for (const pat of TRIVIAL_PATTERNS) {
    if (pat.re.test(p)) {
      return { mode: 'fast', op: pat.op, confidence: 0.95, targetHints };
    }
  }

  // 3. Check Smart / Medium Patterns
  for (const pat of SMART_PATTERNS) {
    if (pat.re.test(p)) {
      return { mode: 'smart', op: pat.op, confidence: 0.9, targetHints };
    }
  }

  // 4. Heuristic classification based on prompt length and keywords
  const wordCount = p.split(/\s+/).length;

  if (wordCount <= 12) {
    // Short prompts are almost always single-task fast edits
    return { mode: 'fast', op: 'short_prompt_fast', confidence: 0.8, targetHints };
  }

  if (wordCount <= 30) {
    // Medium prompts default to smart mode (targeted 2-3 files)
    return { mode: 'smart', op: 'medium_prompt_smart', confidence: 0.75, targetHints };
  }

  // Long instructions without specific match default to autonomous
  return { mode: 'autonomous', op: 'long_prompt_autonomous', confidence: 0.7, targetHints };
}

/**
 * Extract potential file paths, @mentions, or quoted symbols from the prompt.
 */
function extractTargetHints(prompt) {
  if (!prompt) return [];
  const hints = [];

  // Extract @filename references
  const atRefs = prompt.match(/@([\w/\-.]+)/g);
  if (atRefs) hints.push(...atRefs.map(r => r.slice(1)));

  // Extract file paths with extensions
  const pathRefs = prompt.match(/[\w/\-.]+\.(js|jsx|ts|tsx|css|json|html|md|py|go|rs)/gi);
  if (pathRefs) hints.push(...pathRefs);

  // Extract quoted file names
  const quoted = prompt.match(/["'`]([\w/\-.]+\.[a-zA-Z0-9]+)["'`]/g);
  if (quoted) hints.push(...quoted.map(r => r.slice(1, -1)));

  return [...new Set(hints)];
}

/**
 * Determine relevant search paths for smart/autonomous tasks.
 */
function getRelevantPaths(prompt) {
  const lp = (prompt || '').toLowerCase();
  const paths = [];

  if (/auth|login|jwt|session|token|user|register|signup/i.test(lp)) {
    paths.push('auth', 'middleware', 'services', 'routes', 'models', 'controllers');
  }
  if (/api|route|endpoint|controller/i.test(lp)) {
    paths.push('routes', 'controllers', 'api');
  }
  if (/database|db|model|schema|mongo|sql/i.test(lp)) {
    paths.push('models', 'db', 'database', 'schemas');
  }
  if (/component|ui|page|view|screen|layout|bulb|button/i.test(lp)) {
    paths.push('components', 'pages', 'views', 'layouts', 'src');
  }
  if (/style|css|theme|color|design/i.test(lp)) {
    paths.push('styles', 'css', 'assets', 'src');
  }
  if (/test|spec|jest|vitest/i.test(lp)) {
    paths.push('tests', '__tests__', 'spec');
  }

  return paths.length > 0 ? paths : ['src', 'lib', 'app'];
}

module.exports = {
  classify,
  extractTargetHints,
  getRelevantPaths,
};
