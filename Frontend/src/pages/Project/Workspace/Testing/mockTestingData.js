/**
 * Mock Data for DevCollab Integrated Testing Environment
 * Prepared for easy connection to real Playwright / Cypress / PixelMatch backend engines in Phase 2.
 */

export const mockTestingStats = {
  totalTests: 3,
  visualDiffDetected: 1,
  failed: 1,
  succeeded: 1,
  totalScreenChanges: 2,
  pixelDeviation: "4.5%",
  duration: "1.24s",
  passRate: "66.7%",
  browser: "Chromium 124.0",
  viewport: "1920x1080",
};

export const mockE2ETests = [
  {
    id: "test-login",
    name: "User Login",
    suite: "AuthFlow.spec.ts",
    passedCount: 1,
    totalCount: 1,
    status: "passed",
    duration: "142ms",
    selected: true,
    steps: [
      { name: "Navigate to /login", status: "passed", duration: "45ms" },
      { name: "Fill credentials input", status: "passed", duration: "28ms" },
      { name: "Click Submit & await JWT token", status: "passed", duration: "69ms" },
    ],
  },
  {
    id: "test-dashboard",
    name: "Dashboard Load",
    suite: "Dashboard.spec.ts",
    passedCount: 1,
    totalCount: 2,
    status: "diff",
    duration: "480ms",
    selected: true,
    steps: [
      { name: "Mount <DevCollabWorkspace />", status: "passed", duration: "120ms" },
      { name: "Fetch Repository stats via REST API", status: "passed", duration: "160ms" },
      { name: "Compare visual snapshot: dashboard-view.png", status: "diff", duration: "200ms", diffPercent: "4.5%" },
    ],
  },
  {
    id: "test-profile",
    name: "Profile Update",
    suite: "ProfileSettings.spec.ts",
    passedCount: 0,
    totalCount: 1,
    status: "failed",
    duration: "310ms",
    selected: true,
    errorMessage: "AssertionError: Expected button gradient 'from-indigo-600' but received 'from-purple-700'",
    steps: [
      { name: "Navigate to /settings/profile", status: "passed", duration: "80ms" },
      { name: "Click 'Save Changes' button", status: "passed", duration: "50ms" },
      { name: "expect(actionBtn).toHaveClass(/gradient-indigo/)", status: "failed", duration: "180ms" },
    ],
  },
];

export const mockFlowNodes = [
  {
    id: "login-1",
    title: "User Login",
    status: "success",
    subtitle: "Status 200 OK (142ms)",
    type: "auth",
  },
  {
    id: "dash-1",
    title: "Dashboard Load",
    status: "success",
    subtitle: "Rendered v1.0.2 (280ms)",
    type: "dom",
  },
  {
    id: "dash-2",
    title: "Dashboard Load",
    status: "failed",
    subtitle: "Visual Diff +4.5% (200ms)",
    type: "visual",
  },
  {
    id: "profile-1",
    title: "Profile Update",
    status: "failed",
    subtitle: "Assertion Mismatch (180ms)",
    type: "logic",
  },
  {
    id: "profile-2",
    title: "Profile Update",
    status: "failed",
    subtitle: "CSS Gradient Conflict",
    type: "style",
  },
  {
    id: "profile-3",
    title: "Profile Update",
    status: "success",
    subtitle: "Secondary Assertion OK",
    type: "logic",
  },
];

export const mockFlowEdges = [
  { from: "login-1", to: "dash-1", status: "success" },
  { from: "login-1", to: "profile-1", status: "failed" },
  { from: "login-1", to: "profile-3", status: "success" },
  { from: "dash-1", to: "dash-2", status: "failed" },
  { from: "dash-2", to: "profile-2", status: "failed" },
];

export const mockVisualDiffLogs = [
  { text: "// Additional logs in Terminal tab", type: "comment" },
  { text: "Playwright detected differences in dashboard_component_screenshot (6.33ms)", type: "log" },
  { text: "PixelMatch detected differences in dashboard_component_screenshot (4.5%)", type: "log" },
  { text: "Playwright detected differences in dashboard_component_screenshot (2.35ms)", type: "log" },
  { text: "E2E Test Stream recording saved: user_login.mp4", type: "success" },
  { text: "All 3 E2E tests completed. 1 visual change flagged for review.", type: "highlight" },
];

export const mockComparisonInfo = {
  baselineVersion: "v1.0.2",
  candidateVersion: "v1.1.0",
  componentName: "dashboard_component_screenshot",
  executionTime: "6.33ms",
  pixelMatchDiff: "4.5%",
};

export const mockAiSuggestions = [
  {
    title: "Explain Failure",
    prompt: "Why did the 'Profile Update' test fail in candidate v1.1.0?",
    category: "diagnosis",
  },
  {
    title: "Pixel Diff Root Cause",
    prompt: "Analyze the 4.5% visual deviation between Baseline v1.0.2 and Candidate v1.1.0",
    category: "visual",
  },
  {
    title: "Generate Playwright Fix",
    prompt: "Generate an updated Playwright test assertion for the new button styling.",
    category: "code",
  },
  {
    title: "Approve Snapshot",
    prompt: "Update baseline snapshot with Candidate v1.1.0 pixel threshold = 0.05",
    category: "snapshot",
  },
];

