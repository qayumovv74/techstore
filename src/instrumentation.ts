/**
 * Выполняется один раз при старте сервера. В продакшене проверяем секреты из .env:
 * лучше не запуститься и сразу сказать, чего не хватает, чем работать с пустым ключом.
 */
export function register() {
  if (process.env.NODE_ENV !== "production" || process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const problems: string[] = [];
  const secret = (name: string, min = 32) => {
    const value = process.env[name];
    if (!value || value.length < min) problems.push(`${name}: не задан или короче ${min} символов`);
    else if (/change-me/i.test(value)) problems.push(`${name}: остался пример из .env.example`);
  };

  secret("SESSION_SECRET");
  secret("PASSWORD_PEPPER");
  secret("CRON_SECRET");
  if (process.env.DEMO_STORE === "1") secret("PAYMENT_WEBHOOK_SECRET");
  if (!process.env.DATABASE_URL) problems.push("DATABASE_URL: не задан");
  // без почты не придёт ссылка подтверждения — а без неё нельзя оформить заказ
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    problems.push("SMTP_HOST / SMTP_USER / SMTP_PASS: почта не настроена, письма не будут уходить");
  }
  if (!process.env.APP_URL) problems.push("APP_URL: не задан");
  else if (!process.env.APP_URL.startsWith("https://")) {
    // cookie сессии в продакшене только для https — по http вход работать не будет
    console.warn("[config] APP_URL без https:// — вход на сайт работает только по https");
  }

  if (problems.length) {
    throw new Error(`Сервер не запущен — проблемы с настройками:\n  ${problems.join("\n  ")}`);
  }
}
