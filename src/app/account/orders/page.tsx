import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { formatPrice, statusLabel } from "@/lib/format";
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
      <div className="rounded-2xl border border-dashed border-border p-10 text-center">
        <p className="font-semibold">Заказов пока нет</p>
        <p className="mt-1 text-sm text-muted">Здесь появится история покупок и статус доставки в реальном времени.</p>
        <Link href="/catalog" className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary-hover">Перейти в каталог →</Link>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {orders.map((o) => (
        <li key={o.id} className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">Заказ TS-{o.number}</p>
            <span className="rounded-full bg-surface-2 px-3 py-1 text-xs">{statusLabel[o.status]}</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {o.createdAt.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} · {o.items.length} поз. · {formatPrice(o.total)}
          </p>
        </li>
      ))}
    </ul>
  );
}
