// Ищет фото товаров на Wikimedia Commons (только свободные лицензии)
// и скачивает превью, чтобы глазами выбрать подходящие.
// node scripts/photos/search.mjs
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const UA = "TechStorePortfolio/1.0 (student portfolio project)";
const OUT = ".photos-cache/search";
// node scripts/photos/search.mjs [queries.json] [cands.json]
const queries = JSON.parse(readFileSync(process.argv[2] ?? "scripts/photos/queries.json", "utf8"));
const candsFile = process.argv[3] ?? `${OUT}/cands.json`;
const THUMBS = candsFile.endsWith("alt-cands.json") ? `${OUT}/thumbs-alt` : `${OUT}/thumbs`;
const cands = existsSync(candsFile) ? JSON.parse(readFileSync(candsFile, "utf8")) : {};
const okLicense = (l) => /^(CC0|CC BY|CC-BY|Public domain|PD)/i.test(l);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, asBuffer = false) {
  for (let i = 0; i < 6; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) return asBuffer ? Buffer.from(await res.arrayBuffer()) : res.json();
    await sleep(3000 * (i + 1));
  }
  throw new Error(`не скачалось: ${url}`);
}

for (const [slug, q] of Object.entries(queries)) {
  if (cands[slug]) continue;
  const params = new URLSearchParams({
    action: "query", format: "json", generator: "search", gsrsearch: `${q} filetype:bitmap`,
    gsrnamespace: "6", gsrlimit: "12", prop: "imageinfo", iiprop: "url|size|extmetadata|mime", iiurlwidth: "320",
  });
  const data = await get(`https://commons.wikimedia.org/w/api.php?${params}`);
  const pages = Object.values(data.query?.pages ?? {}).sort((a, b) => a.index - b.index);
  cands[slug] = pages
    .map((p) => ({ p, ii: p.imageinfo?.[0] ?? {} }))
    .filter(({ ii }) => okLicense(ii.extmetadata?.LicenseShortName?.value ?? ""))
    .filter(({ ii }) => ["image/jpeg", "image/png", "image/webp"].includes(ii.mime) && Math.min(ii.width, ii.height) >= 500)
    .slice(0, 8)
    .map(({ p, ii }) => ({
      title: p.title, thumb: ii.thumburl, url: ii.url, w: ii.width, h: ii.height,
      lic: ii.extmetadata.LicenseShortName.value, licUrl: ii.extmetadata.LicenseUrl?.value ?? "",
      artist: ii.extmetadata.Artist?.value ?? "", page: ii.descriptionurl,
    }));
  console.log(slug, cands[slug].length);
  writeFileSync(candsFile, JSON.stringify(cands, null, 1));
  await sleep(400);
}

for (const [slug, list] of Object.entries(cands)) {
  mkdirSync(`${THUMBS}/${slug}`, { recursive: true });
  for (const [i, c] of list.entries()) {
    const file = `${THUMBS}/${slug}/${i}.jpg`;
    if (existsSync(file)) continue;
    writeFileSync(file, await get(c.thumb, true));
    await sleep(150);
  }
}
console.log("готово");
