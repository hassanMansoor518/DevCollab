import { analyzeCode } from "./services/ai.service.js";

const userSettings = {
  openaiKey: '',
  geminiKey: 'AQ.Ab8RN6KY0s8WVHUtd-6hJa3qlHU1psDXJKxR_Nbjb48CoQACUw',
  defaultModel: 'Gemini 1.5 Pro',
  contextAware: true,
  autoSummarize: true
};

const sampleCode = `
function add(a, b) {
  return a + b;
}
console.log(add(1, 2));
`;

console.log("Testing analyzeCode...");
try {
  const result = await analyzeCode({ code: sampleCode, filename: "test.js", language: "javascript" }, userSettings);
  console.log("SUCCESS:", JSON.stringify(result, null, 2).slice(0, 500));
} catch (err) {
  console.error("ERROR type:", err.constructor.name);
  console.error("ERROR message:", err.message);
  console.error("ERROR status:", err.status || err.code);
}
