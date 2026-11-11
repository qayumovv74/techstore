import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { ShieldCheck } from "lucide-react";
import { db, schema } from "@/db";
import { formatPrice } from "@/lib/format";
import { mockPaymentsEnabled } from "@/lib/demo";
import { PayForm } from "./pay-form";

export const metadata: Metadata = { title: "Тестовая оплата", robots: { index: false } };

const TEST_CARDS = [
  ["4242 4242 4242 4242", "оплата пройдёт"],
  ["4000 0000 0000 0002", "банк откажет"],
];

export default function MockPayPage({ params }: PageProps<"/mock-pay/[externalId]">) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8">
      <Suspense fallback={<div className="h-[480px] w-full animate-pulse rounded-[2rem] bg-surface-2/60" />}>
        <Gateway params={params} />
      </Suspense>
    </main>
  );
}

async function Gateway({ params }: { params: PageProps<"/mock-pay/[externalId]">["params"] }) {
  const { externalId } = await params;
  if (!mockPaymentsEnabled()) notFound();
  const payment = await db.query.payments.findFirst({
    where: eq(schema.payments.externalId, externalId),
    with: { order: { columns: { id: true, number: true, status: true } } },
  });
  if (!payment) notFound();

  if (payment.status !== "PENDING") {
    return (
      <div className="mx-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-ink/60 p-8 text-center backdrop-blur-xl">
        <p className="text-lg font-semibold">Этот платёж уже обработан</p>
        <Link href={`/account/orders/${payment.order.id}`} className="mt-4 inline-block text-sm font-semibold text-lilac hover:text-white">
          Вернуться к заказу →
        </Link>
      </div>
    );
  }

  const amount = formatPrice(payment.amount);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-[2rem] border border-white/10 bg-ink/60 p-6 backdrop-blur-xl sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lilac">Тестовый платёжный шлюз</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Оплата заказа TS-{payment.order.number}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <ShieldCheck className="size-4 text-lilac" aria-hidden /> Данные карты не сохраняются — это демо
          </p>
        </div>
        <p className="text-4xl font-bold tabular-nums">{amount}</p>
      </div>

      <PayForm externalId={externalId} amountLabel={amount} />

      <div className="rounded-3xl border border-dashed border-white/15 bg-ink/55 p-5 text-sm backdrop-blur-md">
        <p className="font-semibold">Деньги не списываются. Тестовые карты:</p>
        <ul className="mt-2 grid gap-1 font-mono text-xs text-muted sm:grid-cols-2">
          {TEST_CARDS.map(([n, what]) => (
            <li key={n}><span className="text-text">{n}</span> — {what}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">Имя — любое латиницей, срок — любой в будущем, CVC — любые 3 цифры.</p>
      </div>

      {/* отмена — на странице заказа: там же предложим скидку вместо отмены */}
      <Link
        href={`/account/orders/${payment.order.id}?cancel=1`}
        className="self-center text-sm text-muted underline-offset-4 hover:text-danger hover:underline"
      >
        Передумали? Отменить заказ
      </Link>
    </div>
  );
}
