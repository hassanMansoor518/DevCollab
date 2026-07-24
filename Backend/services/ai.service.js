require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

const ai = new GoogleGenAI({
  apiKey,
});

// =========================
// CALL LLM ROUTING
// =========================
async function callLLM(prompt, userSettings = null) {
  const defaultModel = userSettings?.defaultModel || "Gemini 1.5 Pro";
  const geminiKey = userSettings?.geminiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openaiKey = userSettings?.openaiKey;

  if (defaultModel.startsWith("GPT")) {
    if (!openaiKey) {
      // Gracefully fall back to Gemini instead of crashing with a 500
      console.warn(`[AI] GPT model selected but no OpenAI key configured. Falling back to gemini-2.5-flash.`);
      const client = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : ai;
      const response = await client.models.generateContent({ model: "gemini-3.6-flash", contents: prompt });
      return response.text;
    }
    const modelName = defaultModel.includes("3.5") ? "gpt-3.5-turbo" : "gpt-4o";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error?.message || "Failed to generate response from OpenAI");
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } else {
    // Only "gemini-2.5-flash" is confirmed working with this SDK + API key.
    // gemini-1.5-* returns 404; gemini-2.0-* returns 429 quota exceeded.
    const modelName = "gemini-3.6-flash";
    const client = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : ai;

    for (let i = 0; i < 3; i++) {
      try {
        const response = await client.models.generateContent({ model: modelName, contents: prompt });
        return response.text;
      } catch (err) {
        if ((err.status === 503 || err.status === 429) && i < 2) {
          console.warn(`Gemini API ${err.status} Error. Retrying in ${Math.pow(2, i + 1)} seconds...`);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i + 1) * 1000));
          continue;
        }
        throw err;
      }
    }
  }
}

// =========================
// CHAT
// =========================
async function generateResult(prompt, projectContext = null, chatHistory = [], userSettings = null) {
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

    return await callLLM(finalPrompt, userSettings);
  } catch (err) {
    console.error("Gemini API error:", err);
    throw err;
  }
}

// =========================
// COMMIT ANALYSIS
// =========================
async function analyzeCommit({ message, patch }, userSettings = null) {
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

    return await callLLM(prompt, userSettings);
  } catch (err) {
    console.error("Gemini Commit Analysis Error:", err);
    throw err;
  }
}

// =========================
// CODE ANALYSIS
// =========================
async function analyzeCode({ code, filename, language }, userSettings = null) {
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

    const rawText = await callLLM(prompt, userSettings);
    let cleanedText = rawText;

    // 1. Try to extract from ```json ... ``` block
    const jsonMatch = cleanedText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      cleanedText = jsonMatch[1];
    } else {
      // 2. Try generic ``` ... ``` block
      const genericMatch = cleanedText.match(/```\s*([\s\S]*?)\s*```/);
      if (genericMatch) {
        cleanedText = genericMatch[1];
      }
    }

    // 3. Last resort: Extract everything from the first '{' to the last '}'
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(cleanedText);
  } catch (err) {
    console.error("Gemini Code Analysis Error:", err);
    throw err;
  }
}

// =========================
// FIX CODE ISSUE
// =========================
async function fixCodeIssue({ code, filename, language, issueTitle, issueDescription }, userSettings = null) {
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

    const rawText = await callLLM(prompt, userSettings);
    let fixedCode = rawText;

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

async function generateProfessionalReport({ code, filename, language, analysisResult }, userSettings = null) {
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

    const rawText = await callLLM(prompt, userSettings);
    let cleanedText = rawText;

    // JSON Extraction logic (same as analyzeCode)
    const jsonMatch = cleanedText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      cleanedText = jsonMatch[1];
    } else {
      const genericMatch = cleanedText.match(/```\s*([\s\S]*?)\s*```/);
      if (genericMatch) {
        cleanedText = genericMatch[1];
      }
    }

    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(cleanedText);
  } catch (err) {
    console.error("Gemini Generate Report Error:", err);
    throw err;
  }
}

module.exports = {
  generateResult,
  analyzeCommit,
  analyzeCode,
  fixCodeIssue,
  generateProfessionalReport
};