import { expect, test } from "@playwright/test";

test("гость кладёт товар в корзину, меняет количество и удаляет", async ({ page }) => {
  await page.goto("/product/apple-airpods-4");
  await page.waitForLoadState("networkidle");
  await page.locator("main").last().getByRole("button", { name: "Купить" }).first().click();
  await expect(page.locator("main").last().getByRole("link", { name: /В корзине/ }).first()).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: /Корзина/ })).toContainText("1 товар");
  await page.getByRole("button", { name: /Увеличить количество/ }).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { name: /Корзина/ })).toContainText("2 товара");
  await page.getByRole("button", { name: "Удалить" }).filter({ visible: true }).click();
  await expect(page.getByText("Корзина пуста")).toBeVisible();
});

test("гостевая корзина переезжает в аккаунт после входа", async ({ page }) => {
  await page.goto("/product/jbl-flip-7");
  await page.waitForLoadState("networkidle");
  await page.locator("main").last().getByRole("button", { name: "Купить" }).first().click();
  await expect(page.locator("main").last().getByRole("link", { name: /В корзине/ }).first()).toBeVisible();

  const email = `cart-${Date.now()}@test.ru`;
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Имя").filter({ visible: true }).fill("Корзина Тест");
  await page.getByLabel("Email").filter({ visible: true }).fill(email);
  await page.getByLabel("Пароль").filter({ visible: true }).fill("secret123");
  await page.getByRole("button", { name: "Создать аккаунт" }).filter({ visible: true }).click();
  await page.waitForURL("**/account");

  await page.goto("/cart");
  await expect(page.getByRole("link", { name: "Flip 7" })).toBeVisible();
});
