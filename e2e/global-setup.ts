import { execSync } from "node:child_process";
import { Client } from "pg";

const ADMIN_URL = "postgres://techstore:techstore@localhost:5432/postgres";
const TEST_DB = "postgres://techstore:techstore@localhost:5432/techstore_test";

/** Перед тестами: чистая база techstore_test с миграциями и демо-данными */
export default async function globalSetup() {
  const admin = new Client(ADMIN_URL);
  await admin.connect();
  await admin.query("DROP DATABASE IF EXISTS techstore_test WITH (FORCE)");
  await admin.query("CREATE DATABASE techstore_test");
  await admin.end();

  const env = { ...process.env, DATABASE_URL: TEST_DB };
  execSync("npx drizzle-kit migrate", { env, stdio: "inherit" });
  execSync("npx tsx scripts/seed.ts", { env, stdio: "inherit" });
  execSync("npx tsx scripts/import-images.ts", { env, stdio: "inherit" });

  // Прогрев: в dev-режиме страницы компилируются при первом заходе. Если десятки тестов
  // одновременно открывают ещё не собранные страницы, dev-сервер шлёт браузерам reload,
  // и тесты падают по таймауту. Поэтому собираем всё заранее, по очереди.
  const base = "http://localhost:3100";
  const routes = [
    "/", "/catalog", "/product/apple-airpods-4", "/login", "/register", "/forgot-password", "/reset-password",
    "/cart", "/checkout", "/delivery", "/account", "/account/orders", "/account/profile", "/account/addresses",
    "/account/favorites", "/admin", "/admin/orders", "/admin/users", "/admin/products", "/admin/products/new",
    "/admin/categories", "/api/health",
  ];
  for (const route of routes) {
    await fetch(base + route, { redirect: "manual" }).catch(() => {});
  }
}
