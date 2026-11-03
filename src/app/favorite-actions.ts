"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";

export type FavoriteResult = { favored: boolean } | { needLogin: true } | { error: string };

export async function toggleFavorite(productId: string): Promise<FavoriteResult> {
  if (!z.uuid().safeParse(productId).success) return { error: "Некорректный товар" };
  const user = await getCurrentUser();
  if (!user) return { needLogin: true };

  const where = and(eq(schema.favorites.userId, user.id), eq(schema.favorites.productId, productId));
  const deleted = await db.delete(schema.favorites).where(where).returning();
  if (deleted.length) {
    revalidatePath("/account/favorites");
    return { favored: false };
  }
  await db.insert(schema.favorites).values({ userId: user.id, productId }).onConflictDoNothing();
  revalidatePath("/account/favorites");
  return { favored: true };
}
