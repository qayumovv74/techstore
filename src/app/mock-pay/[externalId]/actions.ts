"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { sendWebhook } from "@/lib/payments/mock";

export type PayState = { error?: string };

// Здесь код «на стороне шлюза»: проверить карту, списать деньги, уведомить магазин вебхуком
export async function processPayment(externalId: string, _: PayState, fd: FormData): Promise<PayState> {
  const card = String(fd.get("card") ?? "").replace(/\D/g, "");
  const exp = String(fd.get("exp") ?? "");
  const cvc = String(fd.get("cvc") ?? "");
  if (card.length !== 16) return { error: "Номер карты — 16 цифр" };
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) return { error: "Срок действия в формате ММ/ГГ" };
  if (!/^\d{3}$/.test(cvc)) return { error: "CVC — 3 цифры" };

  const payment = await db.query.payments.findFirst({ where: eq(schema.payments.externalId, externalId) });
  if (!payment || payment.status !== "PENDING") return { error: "Платёж уже обработан или не найден" };

  const declined = card === "4000000000000002";
  await sendWebhook({
    event: declined ? "payment.failed" : "payment.succeeded",
    externalId,
    amount: payment.amount,
  });
  revalidatePath("/", "layout");
  redirect(`/account/orders/${payment.orderId}?payment=${declined ? "failed" : "success"}`);
}
