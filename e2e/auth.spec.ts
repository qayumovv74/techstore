import { expect, test } from "@playwright/test";

const PASSWORD = "demo12345";

async function login(page: import("@playwright/test").Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Войти" }).last().click();
}

test("неверный пароль — понятная ошибка", async ({ page }) => {
  await login(page, "user@techstore.ru", "wrong-pass");
  await expect(page.locator("p[role=alert]")).toHaveText("Неверный email или пароль");
});

test("покупатель попадает в кабинет, но не в админку", async ({ page }) => {
  await login(page, "user@techstore.ru");
  await page.waitForURL("**/account");
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/$/);
});

test("админ видит дашборд", async ({ page }) => {
  await login(page, "admin@techstore.ru");
  await page.waitForURL("**/admin");
  await expect(page.getByRole("heading", { name: "Дашборд" })).toBeVisible();
});

test("гостя из кабинета отправляет на вход", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login\?next=%2Faccount/);
});
