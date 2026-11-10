import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { SignJWT } from "jose";
import { Client } from "pg";
import { E2E_PEPPER } from "./helpers";

const ADMIN_URL = "postgres://techstore:techstore@localhost:5432/postgres";
const TEST_DB = "postgres://techstore:techstore@localhost:5432/techstore_test";

/** Перед тестами: чистая база techstore_test с миграциями и демо-данными */
export default async function globalSetup() {
  const admin = new Client(ADMIN_URL);
  await admin.connect();
  await admin.query("DROP DATABASE IF EXISTS techstore_test WITH (FORCE)");
  await admin.query("CREATE DATABASE techstore_test");
  await admin.end();

  const env = { ...process.env, DATABASE_URL: TEST_DB, PASSWORD_PEPPER: E2E_PEPPER };
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
    "/admin/categories", "/admin/support", "/support", "/verify-email", "/api/health",
  ];
  // Закрытые страницы без входа отдают редирект на /login и не собираются — тогда их
  // компиляция случится посреди тестов. Поэтому прогреваем их ещё раз с сессией админа.
  const cookie = await adminSessionCookie();
  for (const route of routes) {
    await fetch(base + route, { redirect: "manual" }).catch(() => {});
    if (cookie) await fetch(base + route, { redirect: "manual", headers: { cookie } }).catch(() => {});
  }
}

/** Cookie сессии админа из тестовой базы — подписана тем же SESSION_SECRET, что у тестового сервера */
async function adminSessionCookie() {
  const secret = process.env.SESSION_SECRET ?? envFileValue("SESSION_SECRET");
  if (!secret) return null;
  const db = new Client(TEST_DB);
  await db.connect();
  const { rows } = await db.query("select id, role, session_version from users where email = 'admin@techstore.ru'");
  await db.end();
  if (!rows.length) return null;
  const token = await new SignJWT({ userId: rows[0].id, role: rows[0].role, sv: rows[0].session_version })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));
  return `ts_session=${token}`;
}

/** Значение из .env без загрузки всего файла в окружение тестов */
function envFileValue(name: string) {
  if (!existsSync(".env")) return undefined;
  const line = readFileSync(".env", "utf8").split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
  return line?.slice(name.length + 1).trim().replace(/^["']|["']$/g, "");
}
