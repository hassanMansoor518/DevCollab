import fetch from "node-fetch";
globalThis.fetch = fetch;

import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

const ai = new GoogleGenAI({
  apiKey,
});

// =========================
// MODEL
// =========================
function getModel() {
  return "gemini-2.5-flash";
}

// =========================
// RETRY WRAPPER
// =========================
async function generateWithRetry(model, contents, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await ai.models.generateContent({ model, contents });
    } catch (err) {
      if (err.status === 503 && i < maxRetries - 1) {
        console.warn(`Gemini API 503 Error. Retrying in ${Math.pow(2, i)} seconds...`);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      throw err;
    }
  }
}

// =========================
// CHAT
// =========================
export async function generateResult(prompt, projectContext = null, chatHistory = []) {
  try {
    let systemPrompt = `You are an elite Software Architect and AI Developer Assistant. 
Your goal is to provide high-quality, production-ready, and repository-specific engineering solutions.

CORE RULES:
1. RESPONSE STYLE: Be concise, professional, and direct. Use engineering terminology.
2. REPO AWARENESS: Always prioritize the provided project structure and summary. 
3. ARCHITECTURE: Follow the existing patterns and architecture of the project.
4. NO HALLUCINATION: If a file or component doesn't exist in the structure, mention that you can't find it.
5. CODE QUALITY: Provide complete, clean, and optimized code snippets.
6. CONTEXT: Use the conversation history to maintain continuity.
`;

    if (projectContext) {
      const { name, githubRepo, structure, summary } = projectContext;
      const structureList = structure
        ? structure.slice(0, 150).map(f => `- ${f.path} (${f.type})`).join('\n')
        : 'Not available';

      systemPrompt += `
CURRENT PROJECT CONTEXT:
- Name: ${name}
- Repository: ${githubRepo || 'Local'}
- Summary: ${summary || 'Codebase not yet indexed.'}

PROJECT STRUCTURE (Top 150 files):
${structureList}
`;
    }

    // Format chat history for context
    const historyContext = chatHistory.length > 0
      ? chatHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.message}`).join('\n\n')
      : "No previous messages in this session.";

    const finalPrompt = `
${systemPrompt}

RECENT CONVERSATION HISTORY:
${historyContext}

NEW USER QUESTION:
${prompt}

Assistant:`;

    const response = await generateWithRetry(getModel(), finalPrompt);

    return response.text;
  } catch (err) {
    console.error("Gemini API error:", err);
    throw err;
  }
}

// =========================
// COMMIT ANALYSIS
// =========================
export async function analyzeCommit({ message, patch }) {
  try {
    const trimmedPatch = patch?.slice(0, 12000);

    const prompt = `
You are a senior software engineer performing a professional code review.

Analyze this GitHub commit:

Commit Message:
${message}

Code Changes:
${trimmedPatch}

Provide:
1. What this commit does
2. Bugs or issues
3. Performance concerns
4. Security risks
5. Improvements
6. Risk level
`;

    const response = await generateWithRetry(getModel(), prompt);

    return response.text;
  } catch (err) {
    console.error("Gemini Commit Analysis Error:", err);
    throw err;
  }
}

// =========================
// CODE ANALYSIS
// =========================
export async function analyzeCode({ code, filename, language }) {
  try {
    const trimmedCode = code?.slice(0, 15000); // Prevent excessively large payloads

    const prompt = `
You are a senior software engineer performing a professional static code analysis.

Analyze this code:
Filename: ${filename}
Language: ${language}

Code:
\`\`\`${language}
${trimmedCode}
\`\`\`

Provide a strict JSON response. Do not include markdown blocks like \`\`\`json. The output MUST be valid JSON matching this structure:
{
  "healthScore": 0-100,
  "complexity": "string rating like 'A+', 'B', 'C'",
  "maintainability": "short phrase like 'High', 'Moderate', 'Needs improvement'",
  "issues": [
    {
      "severity": "high" | "medium" | "low",
      "title": "short descriptive title",
      "description": "longer description",
      "line": "string like 'L10' or 'Global'",
      "hasFix": boolean
    }
  ],
  "suggestions": [
    "string suggestion"
  ]
}
`;

    const response = await generateWithRetry(getModel(), prompt);

    let rawText = response.text;

    // 1. Try to extract from ```json ... ``` block
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      rawText = jsonMatch[1];
    } else {
      // 2. Try generic ``` ... ``` block
      const genericMatch = rawText.match(/```\s*([\s\S]*?)\s*```/);
      if (genericMatch) {
        rawText = genericMatch[1];
      }
    }

    // 3. Last resort: Extract everything from the first '{' to the last '}'
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      rawText = rawText.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(rawText);
  } catch (err) {
    console.error("Gemini Code Analysis Error:", err);
    throw err;
  }
}

// =========================
// FIX CODE ISSUE
// =========================
export async function fixCodeIssue({ code, filename, language, issueTitle, issueDescription }) {
  try {
    const trimmedCode = code?.slice(0, 15000);

    const prompt = `
You are a senior software engineer. Fix the following specific issue in the provided code.

File: ${filename}
Language: ${language}
Issue to fix: ${issueTitle}
Details: ${issueDescription}

Provide ONLY the completely corrected source code for the entire file. Do not include any explanations, markdown formatting like \`\`\`javascript, or extra text. Your output must be purely the corrected code.

Code:
${trimmedCode}
`;

    const response = await generateWithRetry(getModel(), prompt);

    let fixedCode = response.text;

    if (fixedCode.startsWith('\`\`\`')) {
      fixedCode = fixedCode.replace(/^\`\`\`[a-z]*\s*/i, '');
      fixedCode = fixedCode.replace(/\s*\`\`\`$/, '');
    }

    return { fixedCode };
  } catch (err) {
    console.error("Gemini Fix Code Error:", err);
    throw err;
  }
}

// =========================
// GENERATE PROFESSIONAL REPORT
// =========================
export async function generateProfessionalReport({ code, filename, language, analysisResult }) {
  try {
    const trimmedCode = code?.slice(0, 15000);

    const prompt = `
You are a senior software engineering auditor. Generate a comprehensive, professional bug report for the following code.

Filename: ${filename}
Language: ${language}
Initial Analysis: ${JSON.stringify(analysisResult)}

Code:
\`\`\`${language}
${trimmedCode}
\`\`\`

Provide a strict JSON response. The output MUST be valid JSON matching this structure:
{
  "riskLevel": "Critical" | "High" | "Medium" | "Low",
  "executiveSummary": "A high-level summary of the code's health and major findings.",
  "codeQualityOverview": "Analysis of the overall code quality, patterns, and standards.",
  "securityIssues": ["Specific security vulnerability or risk"],
  "performanceConcerns": ["Specific performance bottleneck or concern"],
  "maintainabilityAnalysis": "Assessment of how easy the code is to maintain and scale.",
  "bugSeverityBreakdown": {
    "critical": number,
    "high": number,
    "medium": number,
    "low": number
  },
  "suggestedFixes": ["Description of a fix for a major issue"],
  "aiRecommendations": ["Strategic recommendation for improving the codebase"],
  "finalRiskAssessment": "Final verdict on the code's readiness for production."
}
`;

    const response = await generateWithRetry(getModel(), prompt);

    let rawText = response.text;

    // JSON Extraction logic (same as analyzeCode)
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      rawText = jsonMatch[1];
    } else {
      const genericMatch = rawText.match(/```\s*([\s\S]*?)\s*```/);
      if (genericMatch) {
        rawText = genericMatch[1];
      }
    }

    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      rawText = rawText.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(rawText);
  } catch (err) {
    console.error("Gemini Generate Report Error:", err);
    throw err;
  }
}