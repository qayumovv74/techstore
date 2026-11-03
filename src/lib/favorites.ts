import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "./auth";

/** id избранных товаров текущего пользователя (пусто для гостя) */
export async function getFavoriteIds(): Promise<Set<string>> {
  const user = await getCurrentUser();
  if (!user) return new Set();
  const rows = await db
    .select({ id: schema.favorites.productId })
    .from(schema.favorites)
    .where(eq(schema.favorites.userId, user.id));
  return new Set(rows.map((r) => r.id));
}

export async function isFavorite(userId: string, productId: string) {
  const row = await db.query.favorites.findFirst({
    where: and(eq(schema.favorites.userId, userId), eq(schema.favorites.productId, productId)),
  });
  return Boolean(row);
}
