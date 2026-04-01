import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/browser',
  testMatch: '*.spec.ts',
  timeout: 15000,
  use: {
    baseURL: 'http://localhost:3119',
  },
  webServer: {
    command: 'npx serve -l 3119 --no-clipboard .',
    port: 3119,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});
