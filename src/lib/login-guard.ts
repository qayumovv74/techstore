/**
 * Защита от подбора пароля к конкретному аккаунту.
 * Считаем неудачные входы по email за последние 15 минут — по журналу auth_events,
 * то есть счёт переживает перезапуск сервера и не зависит от IP (перебор с разных адресов тоже ловится).
 * После удачного входа или сброса пароля счёт начинается заново.
 */
import "server-only";
import { and, count, eq, gt, inArray, max } from "drizzle-orm";
import { db, schema } from "@/db";

export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

export async function isLoginLocked(email: string) {
  const { authEvents } = schema;
  const windowStart = new Date(Date.now() - LOCK_MINUTES * 60_000);
  const [last] = await db
    .select({ at: max(authEvents.createdAt) })
    .from(authEvents)
    .where(and(eq(authEvents.email, email), inArray(authEvents.type, ["LOGIN", "PASSWORD_RESET"])));
  const since = last?.at && last.at > windowStart ? last.at : windowStart;
  const [{ n }] = await db
    .select({ n: count() })
    .from(authEvents)
    .where(and(eq(authEvents.email, email), eq(authEvents.type, "LOGIN_FAILED"), gt(authEvents.createdAt, since)));
  return n >= MAX_FAILED_LOGINS;
}
