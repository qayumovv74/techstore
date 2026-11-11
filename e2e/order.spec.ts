import { expect, test, type Page } from "@playwright/test";
import { confirmEmail } from "./helpers";

async function signUpWithCart(page: Page, product = "apple-airpods-4") {
  const email = `order-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.ru`;
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Имя").filter({ visible: true }).fill("Покупатель Тестов");
  await page.getByLabel("Email").filter({ visible: true }).fill(email);
  await page.getByLabel("Пароль").filter({ visible: true }).fill("secret123");
  await page.getByRole("button", { name: "Создать аккаунт" }).filter({ visible: true }).click();
  await page.waitForURL("**/account");
  await confirmEmail(page); // без подтверждённой почты заказ не оформить

  await page.goto(`/product/${product}`);
  await page.waitForLoadState("networkidle");
  await page.locator("main").last().getByRole("button", { name: "Купить" }).first().click();
  await expect(page.locator("main").last().getByRole("link", { name: /В корзине/ }).first()).toBeVisible();
  return email;
}

async function checkout(page: Page) {
  await page.goto("/cart");
  await page.getByRole("link", { name: "Оформить заказ" }).click();
  await page.waitForURL("**/checkout");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Телефон").filter({ visible: true }).fill("89001234567");
  await page.getByLabel(/Улица и дом/).filter({ visible: true }).fill("ул. Тверская, д. 7");
  await page.getByRole("button", { name: "Перейти к оплате" }).filter({ visible: true }).click();
  await page.waitForURL(/\/mock-pay\//);
  await page.waitForLoadState("networkidle");
}

async function pay(page: Page, card: string) {
  const form = page.locator("form").filter({ visible: true });
  await form.getByLabel("Номер карты").fill(card);
  await form.getByLabel("Имя на карте").fill("TEST BUYER");
  await form.getByLabel("Месяц").selectOption("12");
  await form.getByLabel("Год").selectOption(String(new Date().getFullYear() + 2));
  await form.getByLabel("CVC").fill("123");
  await form.getByRole("button", { name: /Оплатить/ }).click();
  await page.waitForURL(/\/account\/orders\/.+\?payment=/);
}

test("заказ → оплата → менеджер меняет статус → покупатель видит", async ({ page, browser, isMobile }) => {
  test.skip(isMobile, "полный сценарий проверяем на десктопе");
  await signUpWithCart(page);
  await checkout(page);
  await pay(page, "4242424242424242");
  await expect(page.getByText("Оплата прошла")).toBeVisible();
  await expect(page.locator("main").getByText("Оплачен").first()).toBeVisible();
  await expect(page.getByText("обновляется в реальном времени")).toBeVisible();
  const orderUrl = page.url().split("?")[0];
  const number = (await page.getByRole("heading", { name: /Заказ TS-/ }).textContent())!.replace("Заказ ", "");

  // менеджер в другом браузере
  const staff = await browser.newPage();
  await staff.goto("/login");
  await staff.waitForLoadState("networkidle");
  await staff.getByLabel("Email").filter({ visible: true }).fill("manager@techstore.ru");
  await staff.getByLabel("Пароль").filter({ visible: true }).fill("demo12345");
  await staff.getByRole("button", { name: "Войти" }).filter({ visible: true }).last().click();
  await staff.waitForURL("**/admin");
  await staff.goto("/admin/orders?status=PAID");
  await staff.getByRole("link", { name: number }).click();
  // на страницах с живыми обновлениями соединение SSE открыто всегда — networkidle там не наступит
  await staff.getByRole("button", { name: "→ Собирается" }).filter({ visible: true }).click();
  await expect(staff.getByRole("button", { name: "→ В доставке" }).filter({ visible: true })).toBeVisible();
  await staff.close();

  // покупатель видит новый статус без перезагрузки — пришло событие по SSE
  expect(page.url().split("?")[0]).toBe(orderUrl);
  await expect(page.locator("main").getByText("Собирается").filter({ visible: true }).first()).toBeVisible({ timeout: 8000 });
});

test("банк отказал → заказ ждёт оплаты, повторная оплата проходит", async ({ page, isMobile }) => {
  test.skip(isMobile, "проверяем на десктопе");
  await signUpWithCart(page, "jbl-flip-7");
  await checkout(page);
  await pay(page, "4000000000000002");
  await expect(page.getByText("Банк отклонил платёж")).toBeVisible();
  await page.getByRole("link", { name: /Оплатить/ }).click();
  await page.waitForURL(/\/mock-pay\//);
  await page.waitForLoadState("load");
  await page.waitForTimeout(500); // даём форме гидрироваться
  await pay(page, "4242424242424242");
  await expect(page.getByText("Оплата прошла")).toBeVisible();
});

test("вебхук без правильной подписи отклоняется", async ({ request }) => {
  const res = await request.post("/api/payments/webhook", {
    data: { event: "payment.succeeded", externalId: "mock_fake", amount: 100 },
    headers: { "X-Signature": "00".repeat(32) },
  });
  expect(res.status()).toBe(401);
});

test("админ видит в журнале регистрацию с IP и устройством", async ({ page, isMobile }) => {
  test.skip(isMobile, "проверяем на десктопе");
  const email = await signUpWithCart(page, "apple-airtag-4");
  await page.context().clearCookies();
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Email").filter({ visible: true }).fill("admin@techstore.ru");
  await page.getByLabel("Пароль").filter({ visible: true }).fill("demo12345");
  await page.getByRole("button", { name: "Войти" }).filter({ visible: true }).last().click();
  await page.waitForURL("**/admin");
  await page.goto(`/admin/users?q=${encodeURIComponent(email)}`);
  const row = page.locator("tr", { hasText: email });
  await expect(row).toContainText("127.0.0.1");
  await expect(row).toContainText(/Windows|Linux|Mac/);
});

test("отмена: сначала скидка 30%, второй раз — без предложения", async ({ page, isMobile }) => {
  test.skip(isMobile, "проверяем на десктопе");
  await signUpWithCart(page);
  await checkout(page);
  // со страницы оплаты уходим к заказу, не оплачивая
  await page.goto("/account/orders");
  await page.getByRole("link", { name: /TS-\d+/ }).first().click();
  await page.waitForURL(/\/account\/orders\/[0-9a-f-]{36}/);
  await page.getByRole("button", { name: "Отменить заказ" }).click();
  const offer = page.getByRole("region", { name: "Предложение вместо отмены" });
  await expect(offer.getByText("Дарим скидку 30%")).toBeVisible();
  await expect(offer).toContainText(/10\s493/); // 14 990 ₽ − 30% = 10 493 ₽
  await offer.getByRole("button", { name: "Оставить заказ со скидкой" }).click();
  await expect(page.getByText(/Скидка\s4\s497/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Оплатить 10\s493/ })).toBeVisible();

  // второй раз скидку не предлагаем — только подтверждение отмены
  await page.getByRole("button", { name: "Отменить заказ" }).click();
  await expect(page.getByText("Дарим скидку")).toHaveCount(0);
  await page.getByRole("region", { name: "Подтверждение отмены" }).getByRole("button", { name: "Да, отменить" }).click();
  await expect(page.locator("main").getByText("Отменён").first()).toBeVisible();
});

test("со страницы оплаты «Отменить заказ» сразу показывает скидку", async ({ page, isMobile }) => {
  test.skip(isMobile, "проверяем на десктопе");
  await signUpWithCart(page, "jbl-charge-6");
  await checkout(page);
  await page.getByRole("link", { name: "Передумали? Отменить заказ" }).click();
  await page.waitForURL(/\/account\/orders\/[0-9a-f-]{36}\?cancel=1/);
  await expect(page.getByRole("region", { name: "Предложение вместо отмены" })).toContainText("Дарим скидку 30%");
});
