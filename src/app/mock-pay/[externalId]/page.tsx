import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { formatPrice } from "@/lib/format";
import { PayForm } from "./pay-form";

export const metadata: Metadata = { title: "Тестовая оплата", robots: { index: false } };

export default function MockPayPage({ params }: PageProps<"/mock-pay/[externalId]">) {
  return (
    <main className="flex flex-1 items-start justify-center bg-zinc-100 px-4 py-12 text-zinc-900">
      <Suspense fallback={<div className="h-96 w-full max-w-sm animate-pulse rounded-2xl bg-white" />}>
        <Gateway params={params} />
      </Suspense>
    </main>
  );
}

async function Gateway({ params }: { params: PageProps<"/mock-pay/[externalId]">["params"] }) {
  const { externalId } = await params;
  const payment = await db.query.payments.findFirst({
    where: eq(schema.payments.externalId, externalId),
    with: { order: { columns: { id: true, number: true, status: true } } },
  });
  if (!payment) notFound();

  if (payment.status !== "PENDING") {
    return (
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="font-semibold">Этот платёж уже обработан</p>
        <Link href={`/account/orders/${payment.order.id}`} className="mt-4 inline-block text-sm underline">Вернуться к заказу</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Тестовый платёжный шлюз</p>
        <p className="mt-3 text-sm text-zinc-600">TechStore · заказ TS-{payment.order.number}</p>
        <p className="mt-1 text-3xl font-bold">{formatPrice(payment.amount)}</p>
        <div className="mt-6">
          <PayForm externalId={externalId} amountLabel={formatPrice(payment.amount)} />
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 p-4 text-xs text-zinc-600">
        <p className="font-semibold text-zinc-800">Это демо, деньги не списываются.</p>
        <p className="mt-1">4242 4242 4242 4242 — оплата пройдёт</p>
        <p>4000 0000 0000 0002 — банк откажет</p>
        <p>Срок и CVC — любые, например 12/28 и 123</p>
      </div>
    </div>
  );
}
