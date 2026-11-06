import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { StatusBadge } from "@/components/order-timeline";
import { PanelSkeleton } from "../skeleton";

export const metadata: Metadata = { title: "Мои заказы" };


export default function OrdersPage() {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <Orders />
    </Suspense>
  );
}

async function Orders() {
  const user = await requireUser("/account/orders");
  const orders = await db.query.orders.findMany({
    where: eq(schema.orders.userId, user.id),
    orderBy: desc(schema.orders.createdAt),
    with: { items: true },
  });

  if (!orders.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-ink/55 backdrop-blur-md p-10 text-center">
        <p className="font-semibold">Заказов пока нет</p>
        <p className="mt-1 text-sm text-muted">Здесь появится история покупок и статус доставки в реальном времени.</p>
        <Link href="/catalog" className="mt-4 inline-block text-sm font-semibold text-lilac hover:text-white">Перейти в каталог →</Link>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/account/orders/${o.id}`} className="block rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-primary">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">Заказ TS-{o.number}</p>
              <StatusBadge status={o.status} />
            </div>
            <p className="mt-1 text-sm text-muted">
              {o.createdAt.toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: "Europe/Moscow" })} · {o.items.length} поз. · {formatPrice(o.total)}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
