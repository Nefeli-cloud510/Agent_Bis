import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const channel = process.env.PLAYWRIGHT_CHANNEL;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    locale: "zh-CN",
    timezoneId: "Asia/Shanghai",
    trace: "retain-on-failure",
    ...(channel ? { channel } : {}),
  },
  webServer: {
    command: `pnpm exec next dev -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      DATABASE_URL:
        process.env.E2E_DATABASE_URL ??
        "postgres://postgres:postgres@127.0.0.1:55432/d_demo",
      APP_SECRET: "e2e-test-secret-0123456789abcdef",
      ADMIN_USERNAME: "admin",
      ADMIN_PASSWORD: "LocalDevAdmin!2026",
      COLLECTION_PHASE: "dev",
      ALLOW_GROUP_PREVIEW: "true",
      PLAYWRIGHT_BASE_URL: BASE_URL,
    },
  },
});
