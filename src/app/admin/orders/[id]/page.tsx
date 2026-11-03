import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireRole, STAFF_ROLES } from "@/lib/auth";
import { formatPrice, statusLabel } from "@/lib/format";
import { formatPhone } from "@/lib/validation";
import { msk } from "@/lib/datetime";
import { NEXT_STATUSES } from "@/lib/orders";
import { OrderTimeline, StatusBadge } from "@/components/order-timeline";
import { setOrderStatus } from "../actions";

export const metadata: Metadata = { title: "Заказ" };

const paymentLabel = { PENDING: "ожидает", PAID: "оплачен", FAILED: "отклонён", REFUNDED: "возврат" };

export default function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface-2" />}>
      <Order params={params} />
    </Suspense>
  );
}

async function Order({ params }: { params: PageProps<"/admin/orders/[id]">["params"] }) {
  await requireRole(STAFF_ROLES, "/admin/orders");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const order = await db.query.orders.findFirst({
    where: eq(schema.orders.id, id),
    with: {
      user: { columns: { id: true, name: true, email: true } },
      items: true,
      payments: { orderBy: asc(schema.payments.createdAt) },
      events: { orderBy: asc(schema.orderEvents.createdAt), with: { actor: { columns: { name: true, role: true } } } },
    },
  });
  if (!order) notFound();
  const next = NEXT_STATUSES[order.status];

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/orders" className="text-sm text-primary hover:text-primary-hover">← Все заказы</Link>
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Заказ TS-{order.number}</h2>
          <StatusBadge status={order.status} />
        </div>
        <div className="mt-5"><OrderTimeline status={order.status} events={order.events} /></div>
        {next.length ? (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-5">
            {next.map((to) => (
              <form key={to} action={setOrderStatus}>
                <input type="hidden" name="id" value={order.id} />
                <input type="hidden" name="to" value={to} />
                <button className={`h-10 rounded-xl px-4 text-sm font-semibold ${to === "CANCELLED" ? "border border-danger text-danger hover:bg-danger/10" : "bg-primary text-on-primary hover:bg-primary-hover"}`}>
                  {to === "CANCELLED" ? "Отменить заказ" : `→ ${statusLabel[to]}`}
                </button>
              </form>
            ))}
            {order.status === "PENDING_PAYMENT" ? <p className="self-center text-xs text-muted">«Оплачен» ставится только по уведомлению от платёжного шлюза</p> : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
          <h3 className="font-semibold">Покупатель</h3>
          <p className="mt-2"><Link href={`/admin/users/${order.user.id}`} className="hover:text-primary">{order.contactName}</Link> · {formatPhone(order.contactPhone)}</p>
          <p className="text-muted">{order.user.email}</p>
          <h3 className="mt-4 font-semibold">{order.deliveryMethod === "PICKUP" ? "Самовывоз" : "Курьер"}</h3>
          <p className="mt-1 text-muted">
            {order.addressSnapshot.city}, {order.addressSnapshot.street}
            {order.addressSnapshot.apartment ? `, кв. ${order.addressSnapshot.apartment}` : ""}
            {order.addressSnapshot.comment ? ` · ${order.addressSnapshot.comment}` : ""}
          </p>
          {order.comment ? <p className="mt-2">«{order.comment}»</p> : null}
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
          <h3 className="font-semibold">Состав</h3>
          <ul className="mt-2 space-y-1.5">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3"><span>{i.nameAtPurchase} × {i.qty}</span><span>{formatPrice(i.priceAtPurchase * i.qty)}</span></li>
            ))}
            <li className="flex justify-between text-muted"><span>Доставка</span><span>{formatPrice(order.deliveryPrice)}</span></li>
            <li className="flex justify-between border-t border-border pt-2 font-bold"><span>Итого</span><span>{formatPrice(order.total)}</span></li>
          </ul>
          <h3 className="mt-4 font-semibold">Платежи</h3>
          <ul className="mt-1 space-y-1 text-xs text-muted">
            {order.payments.map((p) => (
              <li key={p.id} className="font-mono">{p.externalId} · {formatPrice(p.amount)} · {paymentLabel[p.status]}</li>
            ))}
          </ul>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5 text-sm">
        <h3 className="font-semibold">История</h3>
        <ul className="mt-2 space-y-1.5">
          {order.events.map((e) => (
            <li key={e.id} className="flex flex-wrap gap-x-3">
              <span className="text-muted">{msk(e.createdAt)}</span>
              <span>{e.fromStatus ? `${statusLabel[e.fromStatus]} → ` : ""}{statusLabel[e.toStatus]}</span>
              <span className="text-muted">{e.actor ? e.actor.name : "система / платёжный шлюз"}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
