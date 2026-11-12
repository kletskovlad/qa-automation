import { defineConfig, devices } from '@playwright/test';

// Окремий конфіг: один НАВМИСНО невдалий тест для Trace Viewer.
export default defineConfig({
  testDir: './tests/diagnostics',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report-diagnostic' }],
  ],
  outputDir: 'test-results-diagnostic',
  use: {
    baseURL: 'https://www.saucedemo.com',
    testIdAttribute: 'data-test',
    trace: 'on',
    screenshot: 'on',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
