import "server-only";

/*
  Поддержка.
  SUPPORT_INBOX — куда приходят обращения (личная почта владельца). На сайте НЕ показывается.
  SUPPORT_EMAIL_PUBLIC — адрес компании, который видят покупатели (например support@ваш-домен.ru).
    Пока своего домена нет — оставьте пустым: на сайте будет только форма.
    С доменом: настройте пересылку support@домен → SUPPORT_INBOX (Cloudflare Email Routing, ImprovMX и т.п.).
*/

export const SUPPORT_NAME = "Поддержка TechStore";

export function supportInbox() {
  return process.env.SUPPORT_INBOX || null;
}

export function supportPublicEmail() {
  return process.env.SUPPORT_EMAIL_PUBLIC || null;
}
