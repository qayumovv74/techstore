import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/db";
import { finishGoogleAuth, OAUTH_COOKIE } from "@/lib/google";
import { createSession } from "@/lib/session";
import { mergeGuestCart } from "@/lib/cart";
import { recordAuthEvent } from "@/lib/audit";
import { safeNext } from "@/lib/safe-next";
import { unusablePasswordHash } from "@/lib/password";

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
  // Сотрудники входят только по паролю: Google-аккаунт с той же почтой не должен открывать админку
  if (user && user.role !== "CUSTOMER") return fail("staff");
  if (!user) {
    const byEmail = await db.query.users.findFirst({ where: eq(schema.users.email, profile.email) });
    if (byEmail && byEmail.role !== "CUSTOMER") return fail("staff");
    if (byEmail) {
      // Google подтвердил, что почта принадлежит этому человеку
      [user] = await db
        .update(schema.users)
        .set({ googleId: profile.sub, emailVerifiedAt: byEmail.emailVerifiedAt ?? new Date() })
        .where(eq(schema.users.id, byEmail.id))
        .returning();
    } else {
      // пароля нет: случайный хеш, задать свой можно через «Забыли пароль?»
      const passwordHash = await unusablePasswordHash();
      [user] = await db
        .insert(schema.users)
        .values({
          email: profile.email,
          name: profile.name ?? profile.email.split("@")[0],
          passwordHash,
          googleId: profile.sub,
          emailVerifiedAt: new Date(),
        })
        .returning();
      event = "REGISTER";
    }
  }

  await createSession({ userId: user.id, role: user.role, sv: user.sessionVersion });
  await mergeGuestCart(user.id);
  await recordAuthEvent(event, user.email, user.id);

  const fallback = user.role === "CUSTOMER" ? "/account" : "/admin";
  const res = NextResponse.redirect(new URL(safeNext(saved.next, fallback), req.url));
  res.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth/google" });
  return res;
}
