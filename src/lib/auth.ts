/**
 * Data Access Layer: единственное место, где сессия превращается в пользователя.
 * Каждая страница и Server Action проверяет права через эти функции,
 * а не доверяет proxy.ts или клиенту.
 */
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Role } from "@/db/schema";
import { readSession } from "./session";

export type CurrentUser = { id: string; name: string; email: string; role: Role };

/** Пользователь или null. cache() — один запрос к БД на рендер. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await readSession();
  if (!session) return null;

  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, session.userId),
    columns: { id: true, name: true, email: true, role: true },
  });
  return user ?? null;
});

export async function requireUser(next = "/account") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export const STAFF_ROLES: Role[] = ["MANAGER", "ADMIN"];

export async function requireRole(roles: Role[], next = "/admin") {
  const user = await requireUser(next);
  if (!roles.includes(user.role)) redirect("/");
  return user;
}
