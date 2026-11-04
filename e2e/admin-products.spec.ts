import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

test.skip(({ isMobile }) => isMobile, "админку проверяем на десктопе");

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Email").filter({ visible: true }).fill(email);
  await page.getByLabel("Пароль").filter({ visible: true }).fill("demo12345");
  await page.getByRole("button", { name: "Войти" }).filter({ visible: true }).last().click();
  await page.waitForURL("**/admin");
}

test("админ создаёт товар с фото, он появляется в каталоге", async ({ page }) => {
  await login(page, "admin@techstore.ru");
  await page.goto("/admin/products/new");
  await page.waitForLoadState("networkidle");
  const name = `Тестовый смартфон ${Date.now()}`;
  await page.getByLabel("Название").fill(name);
  await page.getByLabel("Бренд").fill("Nothing");
  await page.getByLabel("Категория").selectOption({ label: "Смартфоны" });
  await page.getByLabel("Описание").fill("Проверка создания товара из админки");
  await page.getByLabel("Характеристика 1").fill("Экран");
  await page.getByLabel("Значение 1").fill('6.7" OLED');
  await page.getByLabel("Цена, ₽").fill("39 990");
  await page.getByLabel("На складе, шт.").fill("5");
  await page.getByLabel("Добавить фото").setInputFiles({
    name: "phone.png",
    mimeType: "image/png",
    buffer: readFileSync("src/app/icon.png"),
  });
  await page.getByRole("button", { name: "Создать товар" }).click();
  await page.waitForURL(/\/admin\/products\/.+\?created=1/);
  await expect(page.getByText("Товар создан")).toBeVisible();

  await page.goto(`/catalog?q=${encodeURIComponent("Тестовый смартфон")}`);
  const card = page.locator("article", { hasText: name });
  await expect(card).toContainText("39 990");
  await expect(card.locator("img")).toHaveAttribute("src", /uploads/);
});

test("менеджер меняет остаток, но не может редактировать товар", async ({ page }) => {
  await login(page, "manager@techstore.ru");
  await page.goto("/admin/products?q=AirTag");
  const input = page.getByLabel(/Остаток AirTag/);
  await input.fill("42");
  await input.locator("xpath=..").getByRole("button", { name: "OK" }).click();
  await expect(page.getByLabel(/Остаток AirTag/)).toHaveValue("42");
  await expect(page.getByRole("link", { name: "+ Товар" })).toHaveCount(0);
  await page.goto("/admin/products/new");
  await expect(page).toHaveURL(/\/$/); // не админ — на главную
});

test("неверный файл вместо фото — понятная ошибка", async ({ page }) => {
  await login(page, "admin@techstore.ru");
  await page.goto("/admin/products?q=Flip");
  await page.getByRole("link", { name: /JBL Flip 7/ }).click();
  await page.waitForURL(/\/admin\/products\/[0-9a-f-]{36}$/);
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Добавить фото").setInputFiles({ name: "virus.png", mimeType: "image/png", buffer: Buffer.from("not an image") });
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.locator("p[role=alert]")).toContainText("не похож на изображение");
});
