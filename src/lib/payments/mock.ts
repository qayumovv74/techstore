import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { appUrl } from "@/lib/mail";

/**
 * Тестовый платёжный шлюз. Устроен как настоящие (ЮKassa, CloudPayments):
 * 1) магазин создаёт платёж и отправляет покупателя на страницу шлюза;
 * 2) шлюз присылает на /api/payments/webhook подписанное уведомление о результате.
 * Чтобы подключить настоящий шлюз, достаточно написать такой же модуль с его API.
 */

function secret() {
  const s = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!s || s.length < 32) throw new Error("PAYMENT_WEBHOOK_SECRET не задан или короче 32 символов");
  return s;
}

export function createPayment() {
  const externalId = `mock_${randomBytes(12).toString("hex")}`;
  return { externalId, payUrl: `/mock-pay/${externalId}` };
}

export type WebhookPayload = {
  event: "payment.succeeded" | "payment.failed";
  externalId: string;
  amount: number;
};

export const sign = (body: string) => createHmac("sha256", secret()).update(body).digest("hex");

export function verify(body: string, signature: string | null) {
  if (!signature) return false;
  const expected = Buffer.from(sign(body), "hex");
  const got = Buffer.from(signature, "hex");
  // timingSafeEqual — чтобы подпись нельзя было подобрать по времени ответа
  return got.length === expected.length && timingSafeEqual(got, expected);
}

/** Шлюз → магазин. В реальности это запрос с серверов платёжной системы. */
export async function sendWebhook(payload: WebhookPayload) {
  const body = JSON.stringify(payload);
  const res = await fetch(`${appUrl()}/api/payments/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Signature": sign(body) },
    body,
  });
  if (!res.ok) throw new Error(`webhook ${res.status}`);
}
