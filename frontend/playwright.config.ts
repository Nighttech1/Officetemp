import { defineConfig, devices } from "@playwright/test";

/**
 * Optional dual E2E (npm @playwright/test).
 * Prefer Python suite in backend/scripts/e2e_cabinet.py when npm PATH is limited.
 *
 * Run (Cursor node helper example):
 *   set PATH=C:\Users\...\helpers;%PATH%
 *   npm i -D @playwright/test && npx playwright install chromium
 *   npx playwright test
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_NO_WEBSERVER
    ? undefined
    : {
        command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
        url: "http://127.0.0.1:3000/login",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
