"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { getCartLineQty, setLine } from "@/lib/cart";

const id = z.uuid();

export async function addToCart(productId: string) {
  if (!id.safeParse(productId).success) return { error: "Некорректный товар" };
  const product = await db.query.products.findFirst({
    where: eq(schema.products.id, productId),
    with: { stock: true },
  });
  const available = (product?.stock?.quantity ?? 0) - (product?.stock?.reserved ?? 0);
  if (!product || !product.isActive || available <= 0) return { error: "Товар закончился" };

  const current = await getCartLineQty(productId);
  await setLine(productId, Math.min(current + 1, available));
  revalidatePath("/cart");
  return { ok: true };
}

export async function updateQty(productId: string, qty: number) {
  if (!id.safeParse(productId).success || !Number.isFinite(qty)) return;
  await setLine(productId, qty);
  revalidatePath("/cart");
}
