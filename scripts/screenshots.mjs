// Скриншоты ключевых экранов для README и проверки вёрстки: node scripts/screenshots.mjs
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const out = "test-results/shots";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: "chrome" });
const shots = [
  ["home", "/", "light", 1280],
  ["catalog", "/catalog?category=smartphones", "light", 1280],
  ["catalog-dark", "/catalog?category=laptops&brand=Apple&brand=ASUS", "dark", 1280],
  ["product", "/product/apple-iphone-17-pro-256gb", "light", 1280],
  ["catalog-mobile", "/catalog?category=audio", "light", 390],
];
for (const [name, path, scheme, width] of shots) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: scheme, deviceScaleFactor: 1 });
  await page.goto(base + path);
  await page.waitForLoadState("networkidle");
  await page.locator('main a[href^="/product/"], main h1').first().waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${name}.png` });
  await page.close();
}
await browser.close();
console.log("готово:", out);
