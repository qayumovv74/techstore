"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { getCurrentUser, STAFF_ROLES } from "@/lib/auth";
import { purchaseOf } from "@/lib/reviews";
import { reviewSchema, type ActionState } from "@/lib/validation";

/** Новый отзыв или правка своего. Только для тех, кто купил товар. */
export async function submitReview(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Войдите, чтобы оставить отзыв" };

  const raw = { productId: String(fd.get("productId") ?? ""), rating: String(fd.get("rating") ?? ""), text: String(fd.get("text") ?? "") };
  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values: { text: raw.text, rating: raw.rating } };

  const orderId = await purchaseOf(user.id, parsed.data.productId);
  if (!orderId) return { error: "Отзыв можно оставить после покупки этого товара" };

  await db
    .insert(schema.reviews)
    .values({ productId: parsed.data.productId, userId: user.id, orderId, rating: parsed.data.rating, text: parsed.data.text })
    .onConflictDoUpdate({
      target: [schema.reviews.userId, schema.reviews.productId],
      set: { rating: parsed.data.rating, text: parsed.data.text, orderId, updatedAt: new Date() },
    });

  revalidatePath("/", "layout");
  return { ok: true, message: "Спасибо! Отзыв опубликован", nonce: Date.now() };
}

/** Автор удаляет свой отзыв, сотрудник — скрывает чужой */
export async function deleteReview(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const id = String(fd.get("id") ?? "");
  const review = await db.query.reviews.findFirst({ where: eq(schema.reviews.id, id), columns: { userId: true } });
  if (!review) return;

  if (review.userId === user.id) {
    await db.delete(schema.reviews).where(and(eq(schema.reviews.id, id), eq(schema.reviews.userId, user.id)));
  } else if (STAFF_ROLES.includes(user.role)) {
    await db.update(schema.reviews).set({ hidden: true }).where(eq(schema.reviews.id, id));
  } else {
    return;
  }
  revalidatePath("/", "layout");
}
