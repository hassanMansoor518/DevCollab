import { GoogleGenAI } from "@google/genai";



// The client gets the API key from the environment variable `GEMINI_API_KEY`.
console.log("Google API Key:", process.env.GOOGLE_API_KEY);
const ai = new GoogleGenAI({
  apiKey: "AIzaSyD0BSdXLxzJvk83G5GJpYJVAFMIbzFxKM4",
});

export async function generateResult(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  return response.text;
}

