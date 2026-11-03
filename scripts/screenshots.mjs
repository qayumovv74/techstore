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
  ["home-dark", "/", "dark", 1280],
  ["home-mobile", "/", "light", 390],
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
// Кабинет под демо-покупателем
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.goto(base + "/login");
await page.waitForLoadState("networkidle");
await page.getByLabel("Email").fill("user@techstore.ru");
await page.getByLabel("Пароль").fill("demo12345");
await page.getByRole("button", { name: "Войти" }).last().click();
await page.waitForURL("**/account");
await page.getByText("Здравствуйте,").waitFor();
await page.screenshot({ path: `${out}/account.png` });
await page.goto(base + "/product/apple-iphone-17-pro-256gb");
await page.waitForLoadState("networkidle");
await page.locator("main").last().getByRole("button", { name: "Купить" }).first().click();
await page.goto(base + "/cart");
await page.getByText("Итого").waitFor();
await page.screenshot({ path: `${out}/cart.png` });
await page.goto(base + "/account/profile");
await page.getByRole("heading", { name: "Личные данные" }).waitFor();
await page.screenshot({ path: `${out}/profile.png` });
await page.goto(base + "/");
await page.waitForLoadState("networkidle");
await page.locator("header").getByRole("button", { name: /Москва|Казань/ }).first().click();
await page.getByRole("combobox", { name: "Название города" }).fill("Ека");
await page.getByRole("option").first().waitFor();
await page.screenshot({ path: `${out}/city.png` });
await page.keyboard.press("Escape");
await page.goto(base + "/account/addresses");
await page.getByRole("heading", { name: "Новый адрес" }).waitFor();
await page.screenshot({ path: `${out}/account-addresses.png` });
await ctx.close();
await browser.close();
console.log("готово:", out);
