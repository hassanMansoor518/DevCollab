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
// CHAT
// =========================
export async function generateResult(prompt) {
  try {
    const response = await ai.models.generateContent({
      model: getModel(),
      contents: prompt,
    });

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

    const response = await ai.models.generateContent({
      model: getModel(),
      contents: prompt,
    });

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

    const response = await ai.models.generateContent({
      model: getModel(),
      contents: prompt,
    });

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