import "server-only";
import { cookies } from "next/headers";
import { CITY_COOKIE, DEFAULT_CITY, isKnownCity } from "@/data/cities";

export async function getCity() {
  const value = (await cookies()).get(CITY_COOKIE)?.value;
  const city = value ? decodeURIComponent(value) : DEFAULT_CITY;
  return isKnownCity(city) ? city : DEFAULT_CITY;
}
