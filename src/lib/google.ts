import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

/*
  Вход через Google по OAuth 2.0 (authorization code + PKCE).
  Ключи — в .env: GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET (Google Cloud → APIs & Services → Credentials).
  Адрес возврата, который нужно прописать в Google: {APP_URL}/api/auth/google/callback
*/

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export const OAUTH_COOKIE = "ts_google_oauth";

export function googleEnabled() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function redirectUri() {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/api/auth/google/callback`;
}

/** Ссылка на экран выбора аккаунта Google + то, что нужно запомнить до возврата */
export function startGoogleAuth() {
  const state = randomBytes(16).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");
  return { url, state, verifier };
}

export type GoogleProfile = { sub: string; email: string; emailVerified: boolean; name: string | null };

/** Меняем code на id_token и проверяем его подпись ключами Google */
export async function finishGoogleAuth(code: string, verifier: string): Promise<GoogleProfile> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google token: ${res.status} ${await res.text()}`);
  const { id_token } = (await res.json()) as { id_token?: string };
  if (!id_token) throw new Error("Google не вернул id_token");

  const { payload } = await jwtVerify(id_token, JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: process.env.GOOGLE_CLIENT_ID!,
  });
  if (typeof payload.sub !== "string" || typeof payload.email !== "string") throw new Error("В id_token нет sub/email");
  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === "string" ? payload.name : null,
  };
}
