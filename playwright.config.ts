import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  reporter: isCI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    // Frontend siempre arranca vía preview (build previo requerido)
    {
      command: 'npm run preview',
      url: 'http://localhost:4173',
      reuseExistingServer: !isCI,
      timeout: 30_000,
    },
    // Backend solo en entorno local (en CI no está disponible)
    ...(!isCI
      ? [
          {
            command: 'cd ../VIGIIAP-backend && npm run dev',
            url: 'http://localhost:4000/api/mapas',
            reuseExistingServer: true,
            timeout: 20_000,
          },
        ]
      : []),
  ],
});
