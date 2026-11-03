import { expect, test } from "@playwright/test";

const main = (page: import("@playwright/test").Page) => page.locator("main").last();

test("категория и фильтр по бренду сужают выдачу", async ({ page }) => {
  await page.goto("/catalog?category=laptops");
  await expect(main(page).getByRole("heading", { level: 1 })).toContainText("Ноутбуки");
  await expect(main(page).locator("article")).toHaveCount(10);

  await page.goto("/catalog?category=laptops&brand=Apple&brand=ASUS");
  await expect(main(page).locator("article")).toHaveCount(4);
  await expect(main(page).getByRole("link", { name: "Убрать фильтр Apple" })).toBeVisible();
});

test("форма фильтров работает: цена и наличие", async ({ page, isMobile }) => {
  test.skip(isMobile, "проверяем на десктопе");
  await page.goto("/catalog");
  await page.locator("#filters").getByLabel("Цена от").fill("100000");
  await page.locator("#filters").getByLabel("Только в наличии").check();
  await page.locator("#filters").getByRole("button", { name: "Применить" }).click();
  await expect(page).toHaveURL(/min=100000/);
  await expect(page).toHaveURL(/stock=1/);
  await expect(main(page).getByRole("link", { name: /Убрать фильтр от 100/ })).toBeVisible();
  const prices = await main(page).locator("article .price").allInnerTexts();
  expect(prices.length).toBeGreaterThan(0);
  for (const p of prices) expect(Number(p.replace(/\D/g, ""))).toBeGreaterThanOrEqual(100000);
});

test("сортировка по цене по убыванию", async ({ page }) => {
  await page.goto("/catalog?sort=price_desc");
  await expect(main(page).locator("article").first()).toBeVisible();
  const prices = (await main(page).locator("article .price").allInnerTexts()).map((p) =>
    Number(p.replace(/\D/g, "")),
  );
  expect(prices).toEqual([...prices].sort((a, b) => b - a));
});

test("поиск находит iPhone, а «100%» не ломает запрос", async ({ page }) => {
  await page.goto("/catalog?q=iphone");
  await expect(main(page).locator("article").first()).toContainText("iPhone");
  await page.goto("/catalog?q=100%25");
  await expect(main(page).getByText("Ничего не нашлось")).toBeVisible();
});

test("страница товара: цена, характеристики, похожие", async ({ page }) => {
  await page.goto("/product/apple-iphone-17-pro-256gb");
  await expect(main(page).getByRole("heading", { level: 1 })).toHaveText("iPhone 17 Pro 256GB");
  await expect(main(page).getByText("Характеристики")).toBeVisible();
  await expect(main(page).getByRole("heading", { name: "Похожие по цене" })).toBeVisible();
});

test("несуществующий товар — страница 404", async ({ page }) => {
  await page.goto("/product/net-takogo");
  await expect(page.getByText("Такого товара нет")).toBeVisible();
});

test("нет горизонтальной прокрутки", async ({ page }) => {
  for (const url of ["/", "/catalog", "/product/apple-iphone-17-pro-256gb"]) {
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), url).toBe(false);
  }
});
