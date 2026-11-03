import { expect, test } from "@playwright/test";

test("город: подсказки по первым буквам и смена сроков доставки", async ({ page, isMobile }) => {
  await page.goto("/delivery");
  await page.waitForLoadState("networkidle");
  const header = page.locator("header");
  await header.getByRole("button", { name: /Москва/ }).first().click();
  const input = page.getByRole("combobox", { name: "Название города" });
  await input.fill("Каз");
  await expect(page.getByRole("option", { name: "Казань" })).toBeVisible();
  await input.press("Enter");
  await expect(header.getByRole("button", { name: /Казань/ }).first()).toBeVisible();
  await expect(page.locator("main")).toContainText("через 2–5 дней");
  test.info().annotations.push({ type: "device", description: isMobile ? "mobile" : "desktop" });
});
