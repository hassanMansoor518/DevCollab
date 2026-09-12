/**
 * agent.patcher.js - Fast, patch-based code editing and diff engine.
 *
 * Prevents full-file rewrites for small edits, saving 70-90% LLM tokens and execution time.
 * Supports:
 * - Direct Search & Replace chunks ({ find, replace })
 * - Fuzzy & whitespace-tolerant hunk matching
 * - Unified diff generation for live review and Monaco Diff viewer
 */

/**
 * Normalize whitespace for tolerant matching
 */
function normalizeWs(str) {
  return (str || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Apply a list of search/replace patches to source content.
 * @param {string} originalContent
 * @param {Array<{ find: string, replace: string }>} patches
 * @returns {{ success: boolean, content: string, appliedCount: number, error?: string }}
 */
function applyPatches(originalContent, patches) {
  if (typeof originalContent !== 'string') {
    return { success: false, content: '', appliedCount: 0, error: 'Original content is not a string' };
  }

  if (!Array.isArray(patches) || patches.length === 0) {
    return { success: true, content: originalContent, appliedCount: 0 };
  }

  let content = originalContent.replace(/\r\n/g, '\n');
  let appliedCount = 0;

  for (let i = 0; i < patches.length; i++) {
    const patch = patches[i];
    let findStr = (patch.find || '').replace(/\r\n/g, '\n');
    const replaceStr = (patch.replace !== undefined ? patch.replace : '').replace(/\r\n/g, '\n');

    if (!findStr) continue;

    // 1. Exact match attempt
    if (content.includes(findStr)) {
      content = content.replace(findStr, replaceStr);
      appliedCount++;
      continue;
    }

    // 2. Trimmed match attempt
    const trimmedFind = findStr.trim();
    if (trimmedFind && content.includes(trimmedFind)) {
      content = content.replace(trimmedFind, replaceStr.trim());
      appliedCount++;
      continue;
    }

    // 3. Line-by-line whitespace-tolerant match
    const findLines = findStr.split('\n').map(l => l.trim()).filter(Boolean);
    const contentLines = content.split('\n');

    let matchStartIndex = -1;
    for (let c = 0; c <= contentLines.length - findLines.length; c++) {
      let allMatched = true;
      for (let f = 0; f < findLines.length; f++) {
        if (contentLines[c + f].trim() !== findLines[f]) {
          allMatched = false;
          break;
        }
      }
      if (allMatched) {
        matchStartIndex = c;
        break;
      }
    }

    if (matchStartIndex !== -1) {
      // Replace the matched line slice
      const replaceLines = replaceStr.split('\n');
      contentLines.splice(matchStartIndex, findLines.length, ...replaceLines);
      content = contentLines.join('\n');
      appliedCount++;
      continue;
    }
  }

  if (appliedCount === 0 && patches.length > 0) {
    return {
      success: false,
      content: originalContent,
      appliedCount: 0,
      error: 'Could not find target code hunk in file. Match failed.',
    };
  }

  return {
    success: true,
    content,
    appliedCount,
  };
}

/**
 * Generate a simple unified line diff string for logging and UI preview.
 * @param {string} oldText
 * @param {string} newText
 * @returns {string}
 */
function createSimpleDiff(oldText, newText) {
  const oldLines = (oldText || '').split('\n');
  const newLines = (newText || '').split('\n');
  const diff = [];

  const maxLines = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLines; i++) {
    const o = oldLines[i];
    const n = newLines[i];
    if (o === n) {
      if (diff.length > 0 && diff[diff.length - 1].startsWith('+') || (diff.length > 0 && diff[diff.length - 1].startsWith('-'))) {
        diff.push(` ${o || ''}`);
      }
    } else {
      if (o !== undefined) diff.push(`-${o}`);
      if (n !== undefined) diff.push(`+${n}`);
    }
  }

  return diff.slice(0, 30).join('\n');
}

/**
 * Perform a lightweight syntax validation on JavaScript / JSX / TypeScript / JSON.
 * @param {string} filePath
 * @param {string} content
 * @returns {{ valid: boolean, error?: string }}
 */
function validateSyntax(filePath, content) {
  if (!filePath || !content) return { valid: true };

  const ext = filePath.split('.').pop().toLowerCase();

  if (ext === 'json') {
    try {
      JSON.parse(content);
      return { valid: true };
    } catch (err) {
      return { valid: false, error: `JSON Parse Error: ${err.message}` };
    }
  }

  if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) {
    // Check for unmatched braces, parentheses, and brackets
    const stack = [];
    const pairs = { '}': '{', ')': '(', ']': '[' };
    let inString = false;
    let stringChar = null;
    let inComment = false;
    let inLineComment = false;

    for (let i = 0; i < content.length; i++) {
      const ch = content[i];
      const next = content[i + 1];

      // Handle comments
      if (inLineComment) {
        if (ch === '\n') inLineComment = false;
        continue;
      }
      if (inComment) {
        if (ch === '*' && next === '/') {
          inComment = false;
          i++;
        }
        continue;
      }

      if (!inString && ch === '/' && next === '/') {
        inLineComment = true;
        i++;
        continue;
      }
      if (!inString && ch === '/' && next === '*') {
        inComment = true;
        i++;
        continue;
      }

      // Handle strings and template literals
      if (inString) {
        if (ch === '\\') {
          i++; // skip escaped character
          continue;
        }
        if (ch === stringChar) {
          inString = false;
          stringChar = null;
        }
        continue;
      }

      if (ch === '"' || ch === "'" || ch === '`') {
        inString = true;
        stringChar = ch;
        continue;
      }

      // Check brackets
      if (ch === '{' || ch === '(' || ch === '[') {
        stack.push({ char: ch, index: i });
      } else if (ch === '}' || ch === ')' || ch === ']') {
        const expected = pairs[ch];
        const last = stack.pop();
        if (!last || last.char !== expected) {
          return {
            valid: false,
            error: `Syntax Warning: Unmatched bracket '${ch}' around character ${i}`,
          };
        }
      }
    }

    if (stack.length > 0) {
      return {
        valid: false,
        error: `Syntax Warning: Unclosed '${stack[stack.length - 1].char}' bracket`,
      };
    }
  }

  return { valid: true };
}

module.exports = {
  applyPatches,
  createSimpleDiff,
  validateSyntax,
};
