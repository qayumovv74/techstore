import "server-only";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSession,
  verifySession,
  type SessionPayload,
} from "./session-token";

/**
 * remember: false — cookie без срока, браузер забудет её при закрытии
 * (сам токен всё равно истекает через SESSION_TTL_SECONDS).
 */
export async function createSession(payload: SessionPayload, { remember = true }: { remember?: boolean } = {}) {
  const token = await signSession(payload);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, // недоступна из JS — защита от XSS-кражи
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // базовая защита от CSRF
    path: "/",
    maxAge: remember ? SESSION_TTL_SECONDS : undefined,
  });
}

export async function readSession() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
