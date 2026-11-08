/**
 * Ставит сгенерированные фото товаров вместо старых.
 *
 *   1. Картинки кладём в .photos-ai/<slug>.png (jpg, webp тоже подойдут).
 *      Можно вместо файлов положить .photos-ai/urls.json — { "<slug>": "https://..." },
 *      скрипт скачает сам.
 *   2. npm run images:ai — заменит фото и обновит базу.
 *
 * Старые фото вместе с credits.json при первой замене уезжают в ../techstore-old-photos/<slug>/:
 * из репозитория уходят, но не теряются. Обработанные исходники переезжают в .photos-ai/done/,
 * так что повторный запуск трогает только новые файлы.
 * Промпты для генерации — scripts/photos/ai-prompts.json.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = path.resolve(".photos-ai");
const DONE = path.join(SRC, "done");
const DST = path.resolve("public/products");
const OLD = path.resolve("..", "techstore-old-photos");
const SIZE = 1200;
const IMG = /\.(png|jpe?g|webp|avif)$/i;

mkdirSync(DONE, { recursive: true });
const hasFile = (dir, slug) => readdirSync(dir).some((f) => IMG.test(f) && f.replace(IMG, "") === slug);

const urlsFile = path.join(SRC, "urls.json");
if (existsSync(urlsFile)) {
  const urls = JSON.parse(readFileSync(urlsFile, "utf8"));
  for (const [slug, url] of Object.entries(urls)) {
    if (hasFile(SRC, slug) || hasFile(DONE, slug)) continue;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`${slug}: не скачалось (${res.status})`);
      continue;
    }
    const type = res.headers.get("content-type") ?? "";
    const ext = type.includes("jpeg") ? "jpg" : type.includes("webp") ? "webp" : "png";
    writeFileSync(path.join(SRC, `${slug}.${ext}`), Buffer.from(await res.arrayBuffer()));
  }
}

let replaced = 0;
for (const file of readdirSync(SRC).filter((f) => IMG.test(f))) {
  const slug = file.replace(IMG, "");
  const dir = path.join(DST, slug);
  if (!existsSync(dir)) {
    console.warn(`${slug}: такого товара нет в public/products, пропускаю`);
    continue;
  }

  const current = readdirSync(dir).filter((f) => IMG.test(f) || f === "credits.json");
  const backup = path.join(OLD, slug);
  if (!existsSync(backup)) {
    // первая замена — сохраняем оригиналы
    mkdirSync(backup, { recursive: true });
    for (const f of current) renameSync(path.join(dir, f), path.join(backup, f));
  } else {
    // в папке уже сгенерированное фото прошлого запуска
    for (const f of current) rmSync(path.join(dir, f));
  }

  await sharp(path.join(SRC, file))
    .resize(SIZE, SIZE, { fit: "cover" })
    .webp({ quality: 86 })
    .toFile(path.join(dir, "1.webp"));
  renameSync(path.join(SRC, file), path.join(DONE, file));
  replaced++;
}

console.log(`Заменено фото: ${replaced}. Оригиналы — в ${OLD}`);
