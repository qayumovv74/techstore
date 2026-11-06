import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireRole, STAFF_ROLES } from "@/lib/auth";
import { formatPrice, pluralize } from "@/lib/format";
import { msk } from "@/lib/datetime";
import { lowStock, revenueByDay, summary, topProducts } from "@/lib/stats";
import { releaseExpiredReservations } from "@/lib/orders";
import { StatusBadge } from "@/components/order-timeline";
import { LiveRefresh } from "@/components/live-refresh";
import { RevenueChart } from "./revenue-chart";

export const metadata: Metadata = { title: "Админка" };

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface-2" />}>
      <Dashboard />
    </Suspense>
  );
}

function Tile({ label, value, sub, href, tone }: { label: string; value: string; sub?: React.ReactNode; href?: string; tone?: "warn" }) {
  const body = (
    <div className="h-full rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-primary/60">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone === "warn" ? "text-danger" : ""}`}>{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted">{sub}</p> : null}
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

async function Dashboard() {
  await requireRole(STAFF_ROLES, "/admin");
  await releaseExpiredReservations();
  const [s, chart, top, low, latest] = await Promise.all([
    summary(),
    revenueByDay(14),
    topProducts(5),
    lowStock(8),
    db.query.orders.findMany({ orderBy: desc(schema.orders.createdAt), limit: 6, with: { user: { columns: { name: true } } } }),
  ]);

  const delta = s.yesterdayRevenue ? Math.round(((s.todayRevenue - s.yesterdayRevenue) / s.yesterdayRevenue) * 100) : null;

  return (
    <div className="flex flex-col gap-6">
      <LiveRefresh topics={["orders"]} />
      <h2 className="sr-only">Дашборд</h2>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile
          label="Выручка сегодня"
          value={formatPrice(s.todayRevenue)}
          sub={
            <>
              {s.todayOrders} {pluralize(s.todayOrders, ["заказ", "заказа", "заказов"])}
              {delta !== null ? <span className={delta >= 0 ? "text-primary" : "text-danger"}> · {delta >= 0 ? "+" : ""}{delta}% к вчера</span> : null}
            </>
          }
        />
        <Tile label="Выручка за 30 дней" value={formatPrice(s.monthRevenue)} sub={`${s.monthOrders} оплачено · средний чек ${s.avgCheck ? formatPrice(s.avgCheck) : "—"}`} />
        <Tile label="Ждут сборки" value={String(s.toAssemble)} sub={`собираются: ${s.assembling} · в доставке: ${s.shipping}`} href="/admin/orders?status=PAID" />
        <Tile label="Покупатели" value={String(s.customers)} sub={`новых за 7 дней: ${s.newCustomers} · купили: ${s.buyers}`} href="/admin/users" />
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-semibold">Выручка за 14 дней</h3>
          <p className="text-xs text-muted">по дате оплаты, МСК · отменённые не считаются</p>
        </div>
        <div className="mt-4"><RevenueChart data={chart} /></div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="font-semibold">Хиты продаж за 30 дней</h3>
          {top.length ? (
            <ol className="mt-3 space-y-2 text-sm">
              {top.map((p, i) => (
                <li key={p.name} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate"><span className="text-muted">{i + 1}.</span> {p.name}</span>
                  <span className="shrink-0 text-muted">{p.units} шт. · {formatPrice(p.revenue)}</span>
                </li>
              ))}
            </ol>
          ) : <p className="mt-3 text-sm text-muted">Продаж пока не было</p>}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-baseline justify-between">
            <h3 className="font-semibold">Заканчиваются</h3>
            <Link href="/admin/products?stock=low" className="text-sm text-lilac hover:text-white">Остатки →</Link>
          </div>
          {low.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {low.map((p) => (
                <li key={p.id} className="flex justify-between gap-3">
                  <Link href={`/admin/products/${p.id}`} className="min-w-0 truncate hover:text-primary">{p.brand} {p.name}</Link>
                  <span className={`shrink-0 font-semibold ${p.available <= 0 ? "text-danger" : "text-text"}`}>{p.available <= 0 ? "нет" : `${p.available} шт.`}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-muted">Всего хватает</p>}
        </section>
      </div>

      <section>
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold">Последние заказы</h3>
          <Link href="/admin/orders" className="text-sm text-lilac hover:text-white">Все →</Link>
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
        {s.awaitingPayment || s.cancelledMonth ? (
          <p className="mt-2 text-xs text-muted">Ждут оплаты: {s.awaitingPayment} · отменено за 30 дней: {s.cancelledMonth}</p>
        ) : null}
      </section>
    </div>
  );
}
