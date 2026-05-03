import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for E2E tests.
 *
 * Notes:
 * - `webServer` auto-starts `npm run dev` so you don't need to start
 *   the app manually before running `npm run test:e2e`.
 * - We pin to chromium for speed in CI; you can add more browsers under
 *   `projects` once the test suite is stable.
 * - Set BASE_URL in CI to point at a deployed preview (e.g. Vercel)
 *   instead of localhost — the webServer block becomes a no-op when the
 *   URL is reachable.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
