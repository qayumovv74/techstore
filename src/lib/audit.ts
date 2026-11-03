import "server-only";
import { headers } from "next/headers";
import { UAParser } from "ua-parser-js";
import { db, schema } from "@/db";

type AuthEvent = (typeof schema.authEventEnum.enumValues)[number];

/** IP клиента. За Nginx он приходит в X-Forwarded-For / X-Real-IP (настроим при деплое). */
export function clientIp(h: Headers) {
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || h.get("x-real-ip") || null;
  return ip === "::1" || ip === "::ffff:127.0.0.1" ? "127.0.0.1" : ip;
}

/** «iPhone · iOS 18.1 · Safari 18» / «Windows 10 · Chrome 141» */
export function describeDevice(ua: string | null) {
  if (!ua) return null;
  const r = new UAParser(ua).getResult();
  const device = [r.device.vendor, r.device.model].filter(Boolean).join(" ");
  const os = [r.os.name, r.os.version].filter(Boolean).join(" ");
  const browser = [r.browser.name, r.browser.major].filter(Boolean).join(" ");
  const parts = [device, os, browser].filter(Boolean);
  return parts.length ? parts.join(" · ") : ua.slice(0, 80);
}

export async function recordAuthEvent(type: AuthEvent, email: string, userId: string | null) {
  try {
    const h = await headers();
    const ua = h.get("user-agent");
    await db.insert(schema.authEvents).values({
      type,
      email,
      userId,
      ip: clientIp(h),
      userAgent: ua,
      device: describeDevice(ua),
    });
  } catch (e) {
    console.error("[audit]", e); // журнал не должен мешать входу
  }
}
