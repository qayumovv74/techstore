import { defineConfig, devices } from "@playwright/test";

/**
 * E2E-тесты работают на ОТДЕЛЬНОЙ базе techstore_test и своём сервере на порту 3100,
 * поэтому не засоряют рабочую базу тестовыми пользователями и заказами.
 * Нужен только запущенный PostgreSQL (npm run db:local). Запуск: npm run test:e2e
 */
const PORT = 3100;
const TEST_DB = "postgres://techstore:techstore@localhost:5432/techstore_test";
const chrome = process.env.CI ? undefined : "chrome"; // локально — установленный Chrome

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: true,
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: chrome,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npx next dev --port ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      DATABASE_URL: TEST_DB,
      NEXT_DIST_DIR: ".next-test",
      APP_URL: `http://localhost:${PORT}`,
      MAIL_TRANSPORT: "json", // письма не отправляются, только пишутся в лог
    },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: chrome } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel: chrome } },
  ],
});
