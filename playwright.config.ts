import { defineConfig, devices } from "@playwright/test";

/**
 * E2E-тесты. Нужны запущенные база (npm run db:local) и сайт (npm run dev).
 * Запуск: npm run test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    // Локально используем установленный Chrome, в CI — скачанный Chromium
    channel: process.env.CI ? undefined : "chrome",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: process.env.CI ? undefined : "chrome" } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel: process.env.CI ? undefined : "chrome" } },
  ],
});
