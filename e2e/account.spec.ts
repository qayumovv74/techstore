import { expect, test, type Page } from "@playwright/test";

/** Каждый тест — свой новый пользователь, чтобы тесты не мешали друг другу */
async function signUp(page: Page) {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.ru`;
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Имя").fill("Тестовый Покупатель");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль").fill("secret123");
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await page.waitForURL("**/account");
  return email;
}

test("профиль: телефон проверяется и сохраняется", async ({ page }) => {
  await signUp(page);
  await page.goto("/account/profile");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Телефон").fill("12345");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByText("Номер из 10 цифр после +7")).toBeVisible();

  await page.getByLabel("Телефон").fill("8 (900) 123-45-67");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByRole("status")).toHaveText("✓ Сохранено");
  await page.reload();
  await expect(page.getByLabel("Телефон")).toHaveValue("+7 (900) 123-45-67");
});

test("телефон: маска подставляет +7 ( при фокусе", async ({ page }) => {
  await signUp(page);
  await page.goto("/account/profile");
  await page.waitForLoadState("networkidle");
  const phone = page.getByLabel("Телефон");
  await phone.click();
  await expect(phone).toHaveValue("+7 (");
  await phone.pressSequentially("9001234567");
  await expect(phone).toHaveValue("+7 (900) 123-45-67");
  await phone.press("Backspace");
  await phone.press("Backspace");
  await expect(phone).toHaveValue("+7 (900) 123-45");
});

test("адреса: первый становится основным, можно удалить", async ({ page }) => {
  await signUp(page);
  await page.goto("/account/addresses");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Улица и дом").fill("ул. Тверская, д. 7");
  await page.getByLabel("Квартира / офис").fill("12");
  await page.getByRole("button", { name: "Добавить адрес" }).click();
  const card = page.locator("li", { hasText: "ул. Тверская, д. 7" });
  await expect(card).toContainText("основной");
  await card.getByRole("button", { name: /Удалить/ }).click();
  await expect(page.getByText("Адресов пока нет")).toBeVisible();
});

test("избранное: сердечко сохраняет товар в кабинете", async ({ page }) => {
  await signUp(page);
  await page.goto("/product/apple-airpods-4");
  await page.waitForLoadState("networkidle");
  await page.locator("main").last().getByRole("button", { name: "В избранное" }).first().click();
  await expect(page.locator("main").last().getByRole("button", { name: "Убрать из избранного" }).first()).toBeVisible();
  await page.goto("/account/favorites");
  await expect(page.locator("article")).toHaveCount(1);
  await expect(page.locator("article")).toContainText("AirPods 4");
});

test("гостя сердечко отправляет на вход", async ({ page }) => {
  await page.goto("/catalog");
  await page.waitForLoadState("networkidle");
  await page.locator("article").first().getByRole("button", { name: "В избранное" }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fcatalog/);
});
