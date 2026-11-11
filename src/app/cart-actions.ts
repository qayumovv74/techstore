"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { getCartLineQty, setLine } from "@/lib/cart";

const id = z.uuid();

/** Сколько товара можно положить в корзину: только существующий, активный, в пределах остатка */
async function availableQty(productId: string) {
  const product = await db.query.products.findFirst({
    where: eq(schema.products.id, productId),
    with: { stock: true },
  });
  if (!product || !product.isActive) return 0;
  return Math.max(0, (product.stock?.quantity ?? 0) - (product.stock?.reserved ?? 0));
}

export async function addToCart(productId: string) {
  if (!id.safeParse(productId).success) return { error: "Некорректный товар" };
  const available = await availableQty(productId);
  if (available <= 0) return { error: "Товар закончился" };

  const current = await getCartLineQty(productId);
  await setLine(productId, Math.min(current + 1, available));
  revalidatePath("/cart");
  return { ok: true };
}

export async function updateQty(productId: string, qty: number) {
  if (!id.safeParse(productId).success || !Number.isFinite(qty)) return;
  // количество из браузера не доверяем: не больше остатка, несуществующий товар — убираем из корзины
  const available = qty > 0 ? await availableQty(productId) : 0;
  await setLine(productId, Math.min(qty, available));
  revalidatePath("/cart");
}
