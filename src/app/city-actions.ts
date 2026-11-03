"use server";

import { cookies } from "next/headers";
import { CITY_COOKIE, isKnownCity } from "@/data/cities";

export async function setCity(city: string) {
  if (!isKnownCity(city)) return { error: "Такого города нет в списке" };
  (await cookies()).set(CITY_COOKIE, encodeURIComponent(city), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return { ok: true };
}
