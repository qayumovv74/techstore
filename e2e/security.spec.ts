import { expect, test, type Page } from "@playwright/test";
import bcrypt from "bcryptjs";
import { Client } from "pg";
import { confirmEmail } from "./helpers";

const TEST_DB = "postgres://techstore:techstore@localhost:5432/techstore_test";
const PASSWORD = "testpass123";

async function register(page: Page) {
  const email = `sec-${Date.now()}-${Math.round(Math.random() * 1e5)}@test.ru`;
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Имя").filter({ visible: true }).fill("Проверка Безопасности");
  await page.getByLabel("Email").filter({ visible: true }).fill(email);
  await page.getByLabel("Пароль").filter({ visible: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Создать аккаунт" }).filter({ visible: true }).click();
  await page.waitForURL("**/account");
  return email;
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Email").filter({ visible: true }).fill(email);
  await page.getByLabel("Пароль").filter({ visible: true }).fill(password);
  await page.getByRole("button", { name: "Войти" }).filter({ visible: true }).last().click();
}

async function sql<T = Record<string, unknown>>(query: string, params: unknown[] = []) {
  const c = new Client(TEST_DB);
  await c.connect();
  try {
    return (await c.query(query, params)).rows as T[];
  } finally {
    await c.end();
  }
}

test.describe("безопасность", () => {
  test.skip(({ isMobile }) => isMobile, "проверяем на десктопе");

  test("на странице входа нет демо-паролей", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Войти" }).filter({ visible: true }).last()).toBeVisible();
    await expect(page.getByText(/demo12345|admin@techstore\.ru/)).toHaveCount(0);
  });

  test("заголовки безопасности на месте", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["content-security-policy"]).toContain("object-src 'none'");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("сотруднику ссылка «Забыли пароль?» по почте не уходит", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Email").filter({ visible: true }).fill("admin@techstore.ru");
    await page.getByRole("button", { name: "Получить ссылку" }).click();
    // ответ тот же, что и для всех, но письма нет — в тестах ссылка из письма показывается на странице
    await expect(page.getByText(/Если аккаунт с адресом admin@techstore\.ru существует/)).toBeVisible();
    await expect(page.getByRole("link", { name: /Задать новый пароль/ })).toHaveCount(0);
  });

  test("cron без верного секрета закрыт", async ({ request }) => {
    for (const auth of [undefined, "Bearer undefined", "Bearer wrong"]) {
      const res = await request.get("/api/cron/release", { headers: auth ? { Authorization: auth } : {} });
      expect(res.status()).toBe(401);
    }
  });

  test("пароль хранится в argon2id, старый bcrypt перехешируется при входе", async ({ page }) => {
    const email = await register(page);
    const [fresh] = await sql<{ password_hash: string }>("select password_hash from users where email = $1", [email]);
    expect(fresh.password_hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect(fresh.password_hash).not.toContain(PASSWORD);

    // как будто аккаунт создан до перехода на argon2
    await sql("update users set password_hash = $2 where email = $1", [email, await bcrypt.hash(PASSWORD, 10)]);
    await page.context().clearCookies();
    await login(page, email, PASSWORD);
    await page.waitForURL("**/account");
    const [upgraded] = await sql<{ password_hash: string }>("select password_hash from users where email = $1", [email]);
    expect(upgraded.password_hash).toMatch(/^\$argon2id\$/);
  });

  test("после 5 неверных паролей вход временно закрыт даже с верным", async ({ page }) => {
    const email = await register(page);
    await page.context().clearCookies();
    for (let i = 0; i < 5; i++) {
      await login(page, email, `wrong-${i}-pass`);
      await expect(page.locator("p[role=alert]")).toHaveText("Неверный email или пароль");
    }
    await login(page, email, PASSWORD);
    await expect(page.locator("p[role=alert]")).toContainText("Слишком много неудачных попыток");
    await expect(page).toHaveURL(/\/login/);
  });

  test("без подтверждённой почты заказ не оформить", async ({ page }) => {
    await register(page);
    await page.goto("/product/apple-airpods-4");
    await page.waitForLoadState("networkidle");
    await page.locator("main").last().getByRole("button", { name: "Купить" }).first().click();
    await expect(page.locator("main").last().getByRole("link", { name: /В корзине/ }).first()).toBeVisible();

    await page.goto("/checkout");
    await expect(page.getByText("Подтвердите почту").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Перейти к оплате" })).toHaveCount(0);

    await confirmEmail(page);
    await page.goto("/checkout");
    await expect(page.getByRole("button", { name: "Перейти к оплате" }).filter({ visible: true })).toBeVisible();
  });

  test("«Выйти на других устройствах» закрывает чужую сессию, текущая остаётся", async ({ page, browser }) => {
    const email = await register(page);
    const other = await browser.newPage();
    await login(other, email, PASSWORD);
    await other.waitForURL("**/account");

    await page.goto("/account/profile");
    await page.getByRole("button", { name: "Выйти на других устройствах" }).click();
    await expect(page.getByText("на других устройствах нужно войти заново")).toBeVisible();

    await page.goto("/account");
    await expect(page).toHaveURL(/\/account$/);
    await other.goto("/account");
    await expect(other).toHaveURL(/\/login/);
    await other.close();
  });

  test("смена пароля закрывает сессии на других устройствах", async ({ page, browser }) => {
    const email = await register(page);
    const other = await browser.newPage();
    await login(other, email, PASSWORD);
    await other.waitForURL("**/account");

    await page.goto("/account/profile");
    await page.getByLabel("Текущий пароль").fill(PASSWORD);
    await page.getByLabel("Новый пароль", { exact: true }).fill("newpass456");
    await page.getByLabel("Повторите новый пароль").fill("newpass456");
    await page.getByRole("button", { name: "Сменить пароль" }).click();
    await expect(page.getByText("Пароль изменён")).toBeVisible();

    await other.goto("/account");
    await expect(other).toHaveURL(/\/login/);
    await other.close();
  });
});
