"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { sendWebhook } from "@/lib/payments/mock";
import { detectBrand, luhn } from "@/lib/card-brand";

export type PayState = { error?: string };

// Здесь код «на стороне шлюза»: проверить карту, списать деньги, уведомить магазин вебхуком.
// Данные карты нигде не сохраняются и не пишутся в лог — только решение «прошла / отказ».
export async function processPayment(externalId: string, _: PayState, fd: FormData): Promise<PayState> {
  const card = String(fd.get("card") ?? "").replace(/\D/g, "");
  const exp = String(fd.get("exp") ?? "");
  const cvc = String(fd.get("cvc") ?? "");
  const brand = detectBrand(card);

  if (!brand.lengths.includes(card.length) || !luhn(card)) return { error: "Проверьте номер карты" };
  const m = exp.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  if (!m) return { error: "Укажите срок действия карты" };
  const now = new Date();
  const expYear = 2000 + Number(m[2]);
  if (expYear < now.getFullYear() || (expYear === now.getFullYear() && Number(m[1]) < now.getMonth() + 1)) {
    return { error: "Срок действия карты истёк" };
  }
  if (!new RegExp(`^\\d{${brand.cvc}}$`).test(cvc)) return { error: `CVC — ${brand.cvc} цифры на обороте карты` };

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
