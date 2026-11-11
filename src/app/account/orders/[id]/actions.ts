"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { applyRetentionDiscount, changeStatus, markRetentionOfferUsed } from "@/lib/orders";
import { retentionOffer } from "@/lib/retention";

/** Отмена покупателем — пока заказ не начали собирать */
export async function cancelMyOrder(fd: FormData) {
  const user = await requireUser("/account/orders");
  const id = z.uuid().parse(fd.get("id"));
  const order = await db.query.orders.findFirst({ where: and(eq(schema.orders.id, id), eq(schema.orders.userId, user.id)) });
  if (!order || !["PENDING_PAYMENT", "PAID"].includes(order.status)) return;

  // если скидку ещё не предлагали — человек её видел и отказался, второй раз не предлагаем
  const owner = await db.query.users.findFirst({ where: eq(schema.users.id, user.id), columns: { retentionOfferAt: true } });
  if (retentionOffer(order, owner?.retentionOfferAt ?? null)) await markRetentionOfferUsed(user.id);

  await changeStatus(id, "CANCELLED", user.id);
  revalidatePath(`/account/orders/${id}`);
}

/** «Оставить заказ со скидкой» — сумму считает сервер, из браузера приходит только id заказа */
export async function keepWithDiscount(fd: FormData) {
  const user = await requireUser("/account/orders");
  const id = z.uuid().parse(fd.get("id"));
  await applyRetentionDiscount(id, user.id);
  revalidatePath(`/account/orders/${id}`);
}
