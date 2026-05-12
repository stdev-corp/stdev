import 'dotenv/config'
import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100)
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './src/e2e',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [
        ['list'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
      ]
    : [
        ['list'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
      ],
  outputDir: 'test-results/e2e',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: process.env.PLAYWRIGHT_SKIP_WEB_SERVER
      ? 'echo skip'
      : `pnpm e2e:prepare && pnpm start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      ...process.env,
      DATABASE_URL:
        process.env.DATABASE_URL ??
        'postgresql://stdev:stdev@localhost:5433/stdev_test',
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ??
        'test-better-auth-secret-32-chars-min-abcd',
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? BASE_URL,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? 'test-google-client-id',
      GOOGLE_CLIENT_SECRET:
        process.env.GOOGLE_CLIENT_SECRET ?? 'test-google-client-secret',
      NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID ?? 'GTM-TEST',
      NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID ?? 'G-TEST',
      NEXT_PUBLIC_CHANNEL_PLUGIN_KEY:
        process.env.NEXT_PUBLIC_CHANNEL_PLUGIN_KEY ?? 'test-channel-key',
      AWS_REGION: process.env.AWS_REGION ?? 'ap-northeast-2',
      AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY ?? 'test-access-key',
      AWS_SECRET_KEY: process.env.AWS_SECRET_KEY ?? 'test-secret-key',
      S3_BUCKET: process.env.S3_BUCKET ?? 'stdev-kr',
    },
  },
})
