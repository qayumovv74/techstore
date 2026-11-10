/**
 * Подтягивает фото товаров из папок public/products/<slug>/ в базу.
 *
 *   1. Положи файлы в папку товара: 1.webp, 2.webp, 3.webp (порядок = по имени)
 *   2. npm run images:import
 *
 * Скрипт можно запускать сколько угодно раз: он заменяет список фото товара
 * на то, что лежит в его папке. Пустая папка — фото не трогаются.
 *
 * К адресу добавляется ?v=<хеш файла>: заменили 1.webp — поменялся адрес, и ни браузер,
 * ни кэш next/image не покажут старую картинку.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, asc } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../src/db/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });
const ROOT = path.resolve("public/products");
const OK = /\.(webp|jpe?g|png|avif)$/i;
const version = (file: string) => createHash("sha1").update(readFileSync(file)).digest("hex").slice(0, 8);

async function main() {
  const products = await db.query.products.findMany({
    orderBy: asc(schema.products.slug),
    with: { images: true },
  });

  let updated = 0;
  const missing: string[] = [];

  for (const p of products) {
    const dir = path.join(ROOT, p.slug);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const files = readdirSync(dir).filter((f) => OK.test(f)).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
    if (!files.length) {
      if (!p.images.length) missing.push(`${p.brand} ${p.name} → public/products/${p.slug}/`);
      continue;
    }
    await db.transaction(async (tx) => {
      await tx.delete(schema.productImages).where(eq(schema.productImages.productId, p.id));
      await tx.insert(schema.productImages).values(
        files.map((f, i) => ({ productId: p.id, url: `/products/${p.slug}/${f}?v=${version(path.join(dir, f))}`, position: i })),
      );
    });
    updated++;
  }

  console.log(`Обновлено товаров: ${updated}. Без фото: ${missing.length}.`);
  for (const line of missing) console.log(`  ${line}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
