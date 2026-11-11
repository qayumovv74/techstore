// Применяет миграции из ./drizzle. Работает в production-образе, где нет drizzle-kit.
// На сервере миграции идут от владельца базы (MIGRATION_DATABASE_URL),
// а сайт работает под ролью без права менять схему (DATABASE_URL) — см. deploy/postgres-init.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL });
await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
await pool.end();
console.log("миграции применены");
