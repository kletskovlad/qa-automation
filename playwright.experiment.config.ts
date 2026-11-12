import { defineConfig, devices } from '@playwright/test';

// Окремий конфіг: експериментальні короткі паузи можуть НАВМИСНО давати збої.
export default defineConfig({
  testDir: './tests/experiments',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report-experiment' }],
  ],
  outputDir: 'test-results-experiment',
  use: {
    baseURL: 'https://www.saucedemo.com',
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
