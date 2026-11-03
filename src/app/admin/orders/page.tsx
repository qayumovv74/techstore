import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { OrderStatus } from "@/db/schema";
import { requireRole, STAFF_ROLES } from "@/lib/auth";
import { formatPrice, statusLabel } from "@/lib/format";
import { msk } from "@/lib/datetime";
import { releaseExpiredReservations } from "@/lib/orders";
import { AutoRefresh } from "@/components/auto-refresh";
import { StatusBadge } from "@/components/order-timeline";

export const metadata: Metadata = { title: "Заказы" };

export default function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface-2" />}>
      <Orders searchParams={searchParams} />
    </Suspense>
  );
}

async function Orders({ searchParams }: { searchParams: PageProps<"/admin/orders">["searchParams"] }) {
  await requireRole(STAFF_ROLES, "/admin/orders");
  await releaseExpiredReservations();
  const { status } = await searchParams;
  const filter = typeof status === "string" && status in statusLabel ? (status as OrderStatus) : undefined;

  const orders = await db.query.orders.findMany({
    where: filter ? eq(schema.orders.status, filter) : undefined,
    orderBy: desc(schema.orders.createdAt),
    limit: 100,
    with: { user: { columns: { name: true, email: true } }, items: { columns: { qty: true } } },
  });

  return (
    <div className="flex flex-col gap-4">
      <AutoRefresh every={10000} />
      <ul className="flex flex-wrap gap-2">
        <li><Link href="/admin/orders" className={`inline-block rounded-full border px-3 py-1 text-xs ${!filter ? "border-primary text-primary" : "border-border"}`}>Все</Link></li>
        {Object.entries(statusLabel).map(([k, v]) => (
          <li key={k}>
            <Link href={`/admin/orders?status=${k}`} className={`inline-block rounded-full border px-3 py-1 text-xs ${filter === k ? "border-primary text-primary" : "border-border"}`}>{v}</Link>
          </li>
        ))}
      </ul>
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Заказ</th>
              <th className="px-4 py-3 font-medium">Создан</th>
              <th className="px-4 py-3 font-medium">Покупатель</th>
              <th className="px-4 py-3 font-medium">Сумма</th>
              <th className="px-4 py-3 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.length ? orders.map((o) => (
              <tr key={o.id} className="hover:bg-surface-2">
                <td className="px-4 py-3"><Link href={`/admin/orders/${o.id}`} className="font-semibold text-primary hover:text-primary-hover">TS-{o.number}</Link></td>
                <td className="px-4 py-3 whitespace-nowrap">{msk(o.createdAt)}</td>
                <td className="px-4 py-3">{o.user.name}<p className="text-xs text-muted">{o.user.email}</p></td>
                <td className="px-4 py-3">{formatPrice(o.total)}<p className="text-xs text-muted">{o.items.reduce((s, i) => s + i.qty, 0)} шт. · {o.deliveryMethod === "PICKUP" ? "самовывоз" : "курьер"}</p></td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">Заказов нет</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
