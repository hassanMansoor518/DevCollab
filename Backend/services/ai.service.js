import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

// 🔹 Normal Chat
export async function generateResult(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  return response.text;
}

// 🔹 Smart Commit Analysis
export async function analyzeCommit({ message, patch }) {
  const trimmedPatch = patch?.slice(0, 12000); // avoid token overflow

  const prompt = `
You are a senior software engineer performing a professional code review.

Analyze this GitHub commit:

Commit Message:
${message}

Code Changes:
${trimmedPatch}

Provide:

1. What this commit does (clear explanation)
2. Potential bugs or logic issues
3. Performance concerns
4. Security risks
5. Code improvement suggestions
6. Risk Level (Low / Medium / High)
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  return response.text;
}