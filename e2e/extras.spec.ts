import { expect, test, type Page } from "@playwright/test";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

async function register(page: Page, name: string) {
  const email = `extra-${Date.now()}-${Math.round(Math.random() * 1e4)}@test.ru`; // латиница: кириллица в email не проходит проверку
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Имя").filter({ visible: true }).fill(name);
  await page.getByLabel("Email").filter({ visible: true }).fill(email);
  await page.getByLabel("Пароль").filter({ visible: true }).fill("testpass123");
  await page.getByRole("button", { name: "Создать аккаунт" }).filter({ visible: true }).click();
  await page.waitForURL("**/account");
  return email;
}

test("несуществующая страница — 404 с кнопками", async ({ page }) => {
  const res = await page.goto("/no-such-page-at-all");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Страница не найдена" })).toBeVisible();
  await expect(page.getByRole("link", { name: "На главную" }).filter({ visible: true }).first()).toBeVisible();
});

test("поддержка: гость отправляет обращение и получает номер", async ({ page }) => {
  await page.goto("/support");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Имя").fill("Недовольный Покупатель");
  await page.getByLabel("Email для ответа").fill(`support-${Date.now()}@test.ru`);
  await page.getByLabel("Тема").selectOption("DELIVERY");
  await page.getByLabel("Что случилось?").fill("коротко");
  await page.getByRole("button", { name: "Отправить в поддержку" }).click();
  await expect(page.getByText("Опишите ситуацию подробнее")).toBeVisible();

  await page.getByLabel("Что случилось?").fill("Курьер не приехал в назначенное время, никто не позвонил.");
  await page.getByRole("button", { name: "Отправить в поддержку" }).click();
  await expect(page.getByRole("heading", { name: /Обращение №\d+ принято/ })).toBeVisible();
});

test("помощник подбирает товары из каталога", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.getByRole("button", { name: "Открыть помощника" }).click();
  const chat = page.getByRole("dialog", { name: "Помощник TechStore" });
  await expect(chat).toBeVisible();
  await chat.getByLabel("Сообщение помощнику").fill("наушники до 10 000");
  await chat.getByRole("button", { name: "Отправить" }).click();
  await expect(chat.getByText(/Нашёл \d+/)).toBeVisible();
  await expect(chat.getByRole("link", { name: /₽/ }).first()).toBeVisible();

  await chat.getByLabel("Сообщение помощнику").fill("хочу пожаловаться");
  await chat.getByRole("button", { name: "Отправить" }).click();
  await expect(chat.getByRole("link", { name: /Написать в поддержку/ }).last()).toBeVisible();
});

test("отзыв может оставить только покупатель", async ({ page }) => {
  await page.goto("/product/jbl-flip-7");
  await expect(page.getByRole("heading", { name: "Отзывы покупателей" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Войдите" })).toBeVisible();

  await register(page, "Читатель");
  await page.goto("/product/jbl-flip-7");
  await expect(page.getByText("Отзыв можно оставить после покупки")).toBeVisible();
});

test("аватарка: загрузка в профиле и показ в кабинете", async ({ page }) => {
  await register(page, "Аватарный");
  await page.goto("/account/profile");
  await page.waitForLoadState("networkidle");
  await page.locator('input[name="avatar"]').setInputFiles({ name: "me.png", mimeType: "image/png", buffer: PNG });
  await page.getByRole("button", { name: "Сохранить фото" }).click();
  await expect(page.getByText("✓ Фото обновлено")).toBeVisible();

  await page.goto("/account");
  await expect(page.locator('main img[src*="avatars"], main img[src*="avatars%2F"]').first()).toBeVisible();
});
