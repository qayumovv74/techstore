import { expect, test } from "@playwright/test";

test("восстановление пароля: ссылка, новый пароль, вход", async ({ page }) => {
  const email = `reset-${Date.now()}@test.ru`;
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Имя").filter({ visible: true }).fill("Забывчивый");
  await page.getByLabel("Email").filter({ visible: true }).fill(email);
  await page.getByLabel("Пароль").filter({ visible: true }).fill("oldpass123");
  await page.getByRole("button", { name: "Создать аккаунт" }).filter({ visible: true }).click();
  await page.waitForURL("**/account");
  await page.context().clearCookies();

  await page.goto("/login");
  await page.getByRole("link", { name: "Забыли пароль?" }).click();
  await page.waitForURL("**/forgot-password");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Email").filter({ visible: true }).fill(email);
  await page.getByRole("button", { name: "Получить ссылку" }).filter({ visible: true }).click();
  await page.getByRole("link", { name: /Задать новый пароль/ }).click();

  await page.waitForURL(/reset-password\?token=/);
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Новый пароль").filter({ visible: true }).fill("newpass456");
  await page.getByLabel("Повторите пароль").filter({ visible: true }).fill("newpass456");
  await page.getByRole("button", { name: "Сохранить и войти" }).filter({ visible: true }).click();
  await page.waitForURL("**/account?reset=1");

  // старая ссылка больше не работает
  await page.goBack();
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Новый пароль").filter({ visible: true }).fill("another789");
  await page.getByLabel("Повторите пароль").filter({ visible: true }).fill("another789");
  await page.getByRole("button", { name: "Сохранить и войти" }).filter({ visible: true }).click();
  await expect(page.getByText("Ссылка устарела или уже использована")).toBeVisible();
});
