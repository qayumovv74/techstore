import { NextResponse, type NextRequest } from "next/server";
import { googleEnabled, OAUTH_COOKIE, startGoogleAuth } from "@/lib/google";
import { safeNext } from "@/lib/safe-next";

/** /api/auth/google?next=/checkout — уходим на экран выбора аккаунта Google */
export async function GET(req: NextRequest) {
  const next = safeNext(req.nextUrl.searchParams.get("next"), "");
  if (!googleEnabled()) {
    const back = new URL("/login", req.url);
    back.searchParams.set("oauth", "off");
    return NextResponse.redirect(back);
  }

  const { url, state, verifier } = startGoogleAuth();
  const res = NextResponse.redirect(url);
  // state и verifier живут 10 минут и видны только обработчику возврата
  res.cookies.set(OAUTH_COOKIE, JSON.stringify({ state, verifier, next }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return res;
}
