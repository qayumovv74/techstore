/**
 * Локальный PostgreSQL без Docker и без установки: бинарники берутся из
 * пакета embedded-postgres в node_modules.
 *
 *   npm run db:local        — запустить (данные в .pgdata, переживают перезапуск)
 *   npm run db:local stop   — остановить
 *
 * Сервер стартует через pg_ctl: на Windows он сам сбрасывает права
 * администратора, иначе postgres.exe отказывается запускаться.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { Client } from "pg";

const pkg = `@embedded-postgres/${process.platform === "win32" ? "windows" : process.platform}-${process.arch}`;
const bin = path.resolve("node_modules", pkg, "native", "bin");
const exe = (name: string) => path.join(bin, process.platform === "win32" ? `${name}.exe` : name);

const DATA = path.resolve(".pgdata");
const LOG = path.join(DATA, "server.log");
const USER = "techstore";
const PASSWORD = "techstore";
const PORT = 5432;

const run = (file: string, args: string[]) => execFileSync(exe(file), args, { stdio: "inherit" });

function init() {
  console.log("Первый запуск: создаю кластер в .pgdata (UTF-8)…");
  const dir = mkdtempSync(path.join(tmpdir(), "pg-"));
  const pwfile = path.join(dir, "pw");
  writeFileSync(pwfile, PASSWORD);
  try {
    run("initdb", ["-D", DATA, "-U", USER, `--pwfile=${pwfile}`, "-E", "UTF8", "--locale=C", "-A", "scram-sha-256"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function ensureDatabase() {
  const client = new Client({ host: "localhost", port: PORT, user: USER, password: PASSWORD, database: "postgres" });
  await client.connect();
  const { rowCount } = await client.query("SELECT 1 FROM pg_database WHERE datname = 'techstore'");
  if (!rowCount) {
    await client.query("CREATE DATABASE techstore");
    console.log("Создал базу techstore");
  }
  await client.end();
}

async function main() {
  if (process.argv[2] === "stop") {
    run("pg_ctl", ["-D", DATA, "stop", "-m", "fast"]);
    return;
  }
  if (!existsSync(path.join(DATA, "PG_VERSION"))) init();

  try {
    execFileSync(exe("pg_ctl"), ["-D", DATA, "status"], { stdio: "ignore" });
    console.log("PostgreSQL уже запущен");
  } catch {
    // stdio: "ignore" — иначе фоновый сервер держит вывод терминала открытым
    execFileSync(exe("pg_ctl"), ["-D", DATA, "-l", LOG, "-o", `-p ${PORT}`, "-w", "start"], { stdio: "ignore" });
    console.log("PostgreSQL запущен (лог: .pgdata/server.log)");
  }
  await ensureDatabase();
  console.log(`Готово: postgres://${USER}:${PASSWORD}@localhost:${PORT}/techstore`);
  console.log("Сервер работает в фоне. Остановить: npm run db:local stop");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
