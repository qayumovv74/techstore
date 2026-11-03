"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { changeStatus } from "@/lib/orders";

export async function cancelMyOrder(fd: FormData) {
  const user = await requireUser("/account/orders");
  const id = z.uuid().parse(fd.get("id"));
  const order = await db.query.orders.findFirst({ where: and(eq(schema.orders.id, id), eq(schema.orders.userId, user.id)) });
  // покупатель может отменить, пока заказ не начали собирать
  if (!order || !["PENDING_PAYMENT", "PAID"].includes(order.status)) return;
  await changeStatus(id, "CANCELLED", user.id);
  revalidatePath(`/account/orders/${id}`);
}
