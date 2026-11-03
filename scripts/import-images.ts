/**
 * Подтягивает фото товаров из папок public/products/<slug>/ в базу.
 * Если рядом лежит credits.json — сохраняем автора и лицензию (для фото с Wikimedia Commons).
 *
 *   1. Положи файлы в папку товара: 1.webp, 2.webp, 3.webp (порядок = по имени)
 *   2. npm run images:import
 *
 * Скрипт можно запускать сколько угодно раз: он заменяет список фото товара
 * на то, что лежит в его папке. Пустая папка — фото не трогаются.
 */
import { readdirSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, asc } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../src/db/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });
const ROOT = path.resolve("public/products");
const OK = /\.(webp|jpe?g|png|avif)$/i;

async function main() {
  const products = await db.query.products.findMany({
    orderBy: asc(schema.products.slug),
    with: { category: true, images: true },
  });

  let updated = 0;
  const missing: typeof products = [];

  for (const p of products) {
    const dir = path.join(ROOT, p.slug);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const files = readdirSync(dir).filter((f) => OK.test(f)).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
    const creditsFile = path.join(dir, "credits.json");
    const credits: { file: string; author: string; license: string; licenseUrl: string; source: string }[] = existsSync(creditsFile)
      ? JSON.parse(readFileSync(creditsFile, "utf8"))
      : [];
    if (!files.length) {
      if (!p.images.length) missing.push(p);
      continue;
    }
    await db.transaction(async (tx) => {
      await tx.delete(schema.productImages).where(eq(schema.productImages.productId, p.id));
      await tx.insert(schema.productImages).values(
        files.map((f, i) => {
          const c = credits.find((x) => x.file === f);
          return {
            productId: p.id,
            url: `/products/${p.slug}/${f}`,
            position: i,
            author: c?.author ?? null,
            license: c?.license ?? null,
            licenseUrl: c?.licenseUrl || null,
            sourceUrl: c?.source ?? null,
          };
        }),
      );
    });
    updated++;
  }

  // Чек-лист: каких фото ещё не хватает
  const lines = [
    "# Фото товаров — чек-лист",
    "",
    "Положи 1–3 фото в папку товара и запусти `npm run images:import`.",
    "Формат: WebP или JPG, квадрат от 1000×1000, белый или прозрачный фон, товар по центру.",
    "Имена файлов: `1.webp` — главное фото, `2.webp`, `3.webp` — дополнительные ракурсы.",
    "",
    `Осталось без фото: ${missing.length} из ${products.length}`,
    "",
    "| Категория | Товар | Папка |",
    "| --- | --- | --- |",
    ...missing.map((p) => `| ${p.category.name} | ${p.brand} ${p.name} | \`public/products/${p.slug}/\` |`),
    "",
  ];
  writeFileSync(path.join(ROOT, "_CHECKLIST.md"), lines.join("\n"));

  console.log(`Обновлено товаров: ${updated}. Без фото: ${missing.length}. Список: public/products/_CHECKLIST.md`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
