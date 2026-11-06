import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/db";
import { finishGoogleAuth, OAUTH_COOKIE } from "@/lib/google";
import { createSession } from "@/lib/session";
import { mergeGuestCart } from "@/lib/cart";
import { recordAuthEvent } from "@/lib/audit";
import { safeNext } from "@/lib/safe-next";

type Saved = { state: string; verifier: string; next: string };

export async function GET(req: NextRequest) {
  const fail = (reason: string) => {
    const url = new URL("/login", req.url);
    url.searchParams.set("oauth", reason);
    const res = NextResponse.redirect(url);
    res.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth/google" });
    return res;
  };

  const params = req.nextUrl.searchParams;
  if (params.get("error")) return fail("denied"); // пользователь нажал «Отмена»

  let saved: Saved | null = null;
  try {
    saved = JSON.parse(req.cookies.get(OAUTH_COOKIE)?.value ?? "null");
  } catch {
    saved = null;
  }
  const code = params.get("code");
  if (!saved || !code || params.get("state") !== saved.state) return fail("state");

  let profile;
  try {
    profile = await finishGoogleAuth(code, saved.verifier);
  } catch (e) {
    console.error("[google]", e);
    return fail("error");
  }
  if (!profile.emailVerified) return fail("unverified");

  // 1) уже входил через Google  2) есть аккаунт с такой почтой — привязываем  3) новый покупатель
  let user = await db.query.users.findFirst({ where: eq(schema.users.googleId, profile.sub) });
  let event: "LOGIN" | "REGISTER" = "LOGIN";
  if (!user) {
    const byEmail = await db.query.users.findFirst({ where: eq(schema.users.email, profile.email) });
    if (byEmail) {
      [user] = await db.update(schema.users).set({ googleId: profile.sub }).where(eq(schema.users.id, byEmail.id)).returning();
    } else {
      // пароля нет: случайный хеш, задать свой можно через «Забыли пароль?»
      const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
      [user] = await db
        .insert(schema.users)
        .values({ email: profile.email, name: profile.name ?? profile.email.split("@")[0], passwordHash, googleId: profile.sub })
        .returning();
      event = "REGISTER";
    }
  }

  await createSession({ userId: user.id, role: user.role });
  await mergeGuestCart(user.id);
  await recordAuthEvent(event, user.email, user.id);

  const fallback = user.role === "CUSTOMER" ? "/account" : "/admin";
  const res = NextResponse.redirect(new URL(safeNext(saved.next, fallback), req.url));
  res.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth/google" });
  return res;
}
