import { defineConfig, devices } from "@playwright/test";
import { E2E_PEPPER } from "./e2e/helpers";

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
  workers: process.env.CI ? undefined : 2, // dev-сервер на Windows не тянет больше без таймаутов
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
      LAN_LINKS: "0", // в письмах localhost, а не адрес в сети
      MAIL_TRANSPORT: "json", // письма не отправляются, только пишутся в лог
      UPLOAD_DIR: "test-results/uploads", // фото из тестов не попадают в рабочую папку
      PASSWORD_PEPPER: E2E_PEPPER, // тот же перец, что у сида в global-setup
      RATE_LIMIT: "off", // все тесты идут с одного IP — лимиты по IP сработали бы сразу
    },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: chrome } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel: chrome } },
  ],
});
