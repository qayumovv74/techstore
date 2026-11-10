import { expect, type Page } from "@playwright/test";

/** Перец паролей для тестовой базы: и сид, и тестовый сервер должны хешировать одинаково */
export const E2E_PEPPER = "techstore-e2e-pepper-only-for-tests-0000";

/**
 * Подтверждение почты как у живого человека: в кабинете «Отправить письмо ещё раз»,
 * ссылка из письма (в тестах письма не уходят, ссылка видна на странице), кнопка «Подтвердить».
 */
export async function confirmEmail(page: Page) {
  await page.goto("/account");
  const notice = page.getByRole("region", { name: "Подтверждение почты" });
  await notice.getByRole("button", { name: "Отправить письмо ещё раз" }).click();
  await notice.getByRole("link", { name: /Подтвердить почту/ }).click();
  await page.waitForURL(/\/verify-email\?token=/);
  await page.getByRole("button", { name: "Подтвердить почту" }).click();
  await page.waitForURL(/\/account\?verified=1/);
  await expect(page.getByText("Подтвердите почту")).toHaveCount(0);
}
