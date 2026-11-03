// Скачивает оригиналы фото заново по ссылкам из public/products/*/credits.json
// в .photos-cache/ (папка в .gitignore). После этого: python3 scripts/photos/process.py
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

const UA = "TechStorePortfolio/1.0 (student portfolio project)";
const CACHE = ".photos-cache";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Wikimedia отвечает 429 / текстом «too many requests» при частых запросах — ждём и повторяем
async function get(url, asJson) {
  for (let attempt = 1; attempt <= 8; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    const body = Buffer.from(await res.arrayBuffer());
    if (res.ok) {
      if (!asJson) return body;
      try {
        return JSON.parse(body.toString("utf8"));
      } catch {}
    }
    await sleep(5000 * attempt);
  }
  throw new Error(`не получилось скачать ${url}`);
}

for (const slug of readdirSync("public/products")) {
  const creditsFile = `public/products/${slug}/credits.json`;
  if (!existsSync(creditsFile)) continue;
  const credits = JSON.parse(readFileSync(creditsFile, "utf8"));
  mkdirSync(`${CACHE}/${slug}`, { recursive: true });
  writeFileSync(`${CACHE}/${slug}/credits.json`, JSON.stringify(credits, null, 2));

  const todo = credits.filter((c) => !existsSync(`${CACHE}/${slug}/${c.file.replace(".webp", ".jpg")}`));
  if (!todo.length) continue;
  const titles = todo.map((c) => decodeURIComponent(c.source.split("/wiki/")[1]));
  const params = new URLSearchParams({
    action: "query", format: "json", titles: titles.join("|"), prop: "imageinfo", iiprop: "url|size", iiurlwidth: "1280",
  });
  const info = await get(`https://commons.wikimedia.org/w/api.php?${params}`, true);
  const byTitle = Object.fromEntries(Object.values(info.query.pages).map((p) => [p.title, p.imageinfo[0]]));
  const normalized = Object.fromEntries((info.query.normalized ?? []).map((n) => [n.from, n.to]));

  for (const [i, c] of todo.entries()) {
    const ii = byTitle[normalized[titles[i]] ?? titles[i]];
    const url = ii.width > 1280 ? ii.thumburl : ii.url;
    writeFileSync(`${CACHE}/${slug}/${c.file.replace(".webp", ".jpg")}`, await get(url, false));
    await sleep(500);
  }
  await sleep(1500);
  console.log(slug);
}
