/**
 * Подпись и проверка токена сессии (JWT, HS256).
 * Без next/headers — поэтому годится и для proxy.ts, и для сокет-сервера.
 */
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/db/schema";

/** sv — users.session_version на момент входа; не совпадёт после смены пароля или «выйти везде» */
export type SessionPayload = { userId: string; role: Role; sv: number };

// __Host- — браузер примет cookie только по https, без Domain и с Path=/: её не подменит поддомен.
// В разработке сайт открыт по http, там префикс не сработает.
export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-ts_session" : "ts_session";
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
    return { userId: payload.userId, role: payload.role, sv: typeof payload.sv === "number" ? payload.sv : 0 };
  } catch {
    return null; // истёк, подделан или битый
  }
}
