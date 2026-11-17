import { defineConfig } from '@playwright/test';

// E2E tests drive a real browser against `npm run demo` (in-memory DB with seeded data, API :4000, client :5173).
// They use the Google Chrome already installed on the machine (and on GitHub's runners), so no browser download.
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    channel: 'chrome',
    viewport: { width: 1280, height: 800 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run demo',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
