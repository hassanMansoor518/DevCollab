import { generateResult } from "./services/ai.service.js";

// Simulate hassan's AI settings - invalid geminiKey
const userSettings = {
  openaiKey: '',
  geminiKey: 'AQ.Ab8RN6KY0s8WVHUtd-6hJa3qlHU1psDXJKxR_Nbjb48CoQACUw',
  defaultModel: 'Gemini 1.5 Pro',
  contextAware: true,
  autoSummarize: true
};

console.log("Testing with invalid geminiKey from hassan's account...");
try {
  const result = await generateResult("Hello, just say OK", null, [], userSettings);
  console.log("SUCCESS:", result);
} catch (err) {
  console.error("ERROR type:", err.constructor.name);
  console.error("ERROR message:", err.message);
  console.error("ERROR status:", err.status || err.code);
  console.error("Full error:", err);
}
