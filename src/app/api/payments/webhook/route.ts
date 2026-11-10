import { z } from "zod";
import { applyPaymentResult } from "@/lib/orders";
import { verify } from "@/lib/payments/mock";
import { mockPaymentsEnabled } from "@/lib/demo";

const payloadSchema = z.object({
  event: z.enum(["payment.succeeded", "payment.failed"]),
  externalId: z.string().min(1),
  amount: z.number().int().positive(),
});

export async function POST(req: Request) {
  if (!mockPaymentsEnabled()) return Response.json({ error: "not found" }, { status: 404 });
  // Подпись считается от сырого тела — поэтому сначала text(), а не json()
  const body = await req.text();
  if (!verify(body, req.headers.get("x-signature"))) {
    return Response.json({ error: "bad signature" }, { status: 401 });
  }

  const parsed = payloadSchema.safeParse(JSON.parse(body));
  if (!parsed.success) return Response.json({ error: "bad payload" }, { status: 400 });

  const { event, externalId, amount } = parsed.data;
  const result = await applyPaymentResult(externalId, amount, event === "payment.succeeded");
  console.log(`[webhook] ${event} ${externalId} → ${result}`);

  // 200 даже на повтор: иначе шлюз будет слать уведомление снова и снова
  if (result === "unknown") return Response.json({ error: "unknown payment" }, { status: 404 });
  if (result === "amount_mismatch") return Response.json({ error: "amount mismatch" }, { status: 400 });
  return Response.json({ ok: true, result });
}
