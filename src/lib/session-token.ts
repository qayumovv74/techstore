/**
 * Подпись и проверка токена сессии (JWT, HS256).
 * Без next/headers — поэтому годится и для proxy.ts, и для сокет-сервера.
 */
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/db/schema";

export type SessionPayload = { userId: string; role: Role };

export const SESSION_COOKIE = "ts_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 дней

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET не задан или короче 32 символов");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, key(), { algorithms: ["HS256"] });
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null; // истёк, подделан или битый
  }
}
