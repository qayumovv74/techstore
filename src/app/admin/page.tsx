import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { and, count, desc, eq, gte, inArray, lte, sql, sum } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireRole, STAFF_ROLES } from "@/lib/auth";
import { formatPrice, roleLabel } from "@/lib/format";
import { msk } from "@/lib/datetime";
import { Card } from "@/components/ui";
import { AutoRefresh } from "@/components/auto-refresh";
import { StatusBadge } from "@/components/order-timeline";

export const metadata: Metadata = { title: "Админка" };

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-surface-2" />}>
      <Dashboard />
    </Suspense>
  );
}

const PAID_STATUSES = ["PAID", "ASSEMBLING", "SHIPPING", "DELIVERED"] as const;

async function Dashboard() {
  const user = await requireRole(STAFF_ROLES, "/admin");
  // «сейчас» берём у базы — так и честнее, и рендер остаётся чистой функцией
  const dayAgo = sql`now() - interval '24 hours'`;
  const weekAgo = sql`now() - interval '7 days'`;
  const { orders, stock } = schema;
  const paid = inArray(orders.status, [...PAID_STATUSES]);

  const [[today], [week], [awaiting], [toProcess], [lowStock], latest] = await Promise.all([
    db.select({ sum: sum(orders.total), n: count() }).from(orders).where(and(paid, gte(orders.createdAt, dayAgo))),
    db.select({ sum: sum(orders.total), n: count() }).from(orders).where(and(paid, gte(orders.createdAt, weekAgo))),
    db.select({ n: count() }).from(orders).where(eq(orders.status, "PENDING_PAYMENT")),
    db.select({ n: count() }).from(orders).where(inArray(orders.status, ["PAID", "ASSEMBLING"])),
    db.select({ n: count() }).from(stock).where(lte(sql`${stock.quantity} - ${stock.reserved}`, 3)),
    db.query.orders.findMany({ orderBy: desc(orders.createdAt), limit: 8, with: { user: { columns: { name: true } } } }),
  ]);

  const tiles = [
    { label: "Выручка за 24 часа", value: formatPrice(Number(today.sum ?? 0)), sub: `${today.n} оплачено` },
    { label: "Выручка за 7 дней", value: formatPrice(Number(week.sum ?? 0)), sub: `средний чек ${week.n ? formatPrice(Math.round(Number(week.sum) / week.n)) : "—"}` },
    { label: "Надо обработать", value: String(toProcess.n), sub: `ждут оплаты: ${awaiting.n}`, href: "/admin/orders?status=PAID" },
    { label: "Заканчиваются", value: String(lowStock.n), sub: "≤ 3 шт. на складе", warn: lowStock.n > 0 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AutoRefresh every={15000} />
      <p className="text-sm text-muted">{user.name} · {roleLabel[user.role]}</p>
      <h2 className="sr-only">Дашборд</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => {
          const body = (
            <Card className="h-full p-5">
              <p className="text-sm text-muted">{t.label}</p>
              <p className={`mt-1 text-2xl font-bold ${t.warn ? "text-danger" : ""}`}>{t.value}</p>
              <p className="mt-1 text-xs text-muted">{t.sub}</p>
            </Card>
          );
          return t.href ? <Link key={t.label} href={t.href} className="block hover:opacity-90">{body}</Link> : <div key={t.label}>{body}</div>;
        })}
      </div>

      <section>
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold">Последние заказы</h3>
          <Link href="/admin/orders" className="text-sm text-primary hover:text-primary-hover">Все →</Link>
        </div>
        <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface">
          {latest.length ? latest.map((o) => (
            <li key={o.id}>
              <Link href={`/admin/orders/${o.id}`} className="grid grid-cols-2 items-center gap-2 px-4 py-3 text-sm hover:bg-surface-2 md:grid-cols-[90px_1fr_200px_120px_130px]">
                <span className="font-semibold">TS-{o.number}</span>
                <span className="text-muted">{o.user.name}</span>
                <span className="text-muted">{msk(o.createdAt)}</span>
                <span className="md:text-right">{formatPrice(o.total)}</span>
                <span className="md:text-right"><StatusBadge status={o.status} /></span>
              </Link>
            </li>
          )) : <li className="px-4 py-8 text-center text-sm text-muted">Заказов пока нет</li>}
        </ul>
      </section>
      <p className="text-xs text-muted">Обновляется автоматически раз в 15 секунд. Мгновенные обновления через WebSocket — на этапе 5.</p>
    </div>
  );
}
