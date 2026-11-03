// Скачивает выбранные фото (1280px — один из стандартных размеров превью Wikimedia) вместе с данными об авторе и лицензии.
// node scripts/photos/download.mjs
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const UA = "TechStorePortfolio/1.0 (student portfolio project)";
const DIR = ".photos-cache/search";
const read = (f) => JSON.parse(readFileSync(`${DIR}/${f}`, "utf8"));
const [main, alt, selection, slugmap] = ["cands.json", "alt-cands.json", "selection.json", "slugmap.json"].map(read);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const stripHtml = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

for (const [oldSlug, { pick }] of Object.entries(selection)) {
  const slug = slugmap[oldSlug];
  const out = `.photos-cache/${slug}`;
  mkdirSync(out, { recursive: true });
  const credits = [];
  for (const [n, [src, idx]] of pick.entries()) {
    const c = (src === "a" ? alt : main)[oldSlug][idx];
    const big = c.w > 1280 ? c.thumb.replace(/\/\d+px-/, "/1280px-") : c.url;
    const file = `${out}/${n + 1}.jpg`;
    if (!existsSync(file)) {
      const res = await fetch(big, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`${res.status} ${big}`);
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      await sleep(300);
    }
    credits.push({ file: `${n + 1}.webp`, author: stripHtml(c.artist) || "неизвестен", license: c.lic, licenseUrl: c.licUrl, source: c.page });
  }
  writeFileSync(`${out}/credits.json`, JSON.stringify(credits, null, 2));
  console.log(slug, pick.length);
}
