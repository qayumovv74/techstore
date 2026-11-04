import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { formatPhone } from "@/lib/validation";
import { msk } from "@/lib/datetime";
import { pendingPayment, releaseExpiredReservations } from "@/lib/orders";
import { LiveRefresh } from "@/components/live-refresh";
import { OrderTimeline, StatusBadge } from "@/components/order-timeline";
import { PanelSkeleton } from "../../skeleton";
import { cancelMyOrder } from "./actions";

export const metadata: Metadata = { title: "Заказ" };

export default function OrderPage(props: PageProps<"/account/orders/[id]">) {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <Order {...props} />
    </Suspense>
  );
}

async function Order({ params, searchParams }: PageProps<"/account/orders/[id]">) {
  const user = await requireUser("/account/orders");
  const { id } = await params;
  const { payment: paymentResult } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  await releaseExpiredReservations();

  const order = await db.query.orders.findFirst({
    where: and(eq(schema.orders.id, id), eq(schema.orders.userId, user.id)),
    with: { items: true, events: { orderBy: asc(schema.orderEvents.createdAt) } },
  });
  if (!order) notFound();
  const payment = order.status === "PENDING_PAYMENT" ? await pendingPayment(order.id) : null;
  const itemsTotal = order.total - order.deliveryPrice;
  const live = !["DELIVERED", "CANCELLED"].includes(order.status);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <Link href="/account/orders" className="text-sm text-primary hover:text-primary-hover">← Все заказы</Link>
        {live ? <LiveRefresh topics={[`order:${order.id}`]} /> : null}
      </div>

      {paymentResult === "success" && order.status !== "PENDING_PAYMENT" ? (
        <p className="rounded-2xl bg-primary/10 p-4 text-sm font-medium text-primary">Оплата прошла. Письмо с деталями отправили на {user.email}.</p>
      ) : null}
      {paymentResult === "failed" && order.status === "PENDING_PAYMENT" ? (
        <p className="rounded-2xl bg-danger/10 p-4 text-sm text-danger">Банк отклонил платёж. Попробуйте другую карту — товары ещё в резерве.</p>
      ) : null}

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Заказ TS-{order.number}</h2>
            <p className="text-sm text-muted">от {msk(order.createdAt)}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="mt-6">
          <OrderTimeline status={order.status} events={order.events} />
        </div>

        {payment ? (
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
            <Link href={payment.payUrl ?? "#"} className="inline-flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-on-primary hover:bg-primary-hover">
              Оплатить {formatPrice(order.total)}
            </Link>
            {order.reservedUntil ? (
              <span className="text-sm text-muted">Резерв до {msk(order.reservedUntil)}</span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
          <h3 className="font-semibold">Получение</h3>
          <p className="mt-2">{order.deliveryMethod === "PICKUP" ? "Самовывоз" : "Курьер"}</p>
          <p className="text-muted">
            {order.addressSnapshot.city}, {order.addressSnapshot.street}
            {order.addressSnapshot.apartment ? `, кв. ${order.addressSnapshot.apartment}` : ""}
          </p>
          <p className="mt-2">{order.contactName} · {formatPhone(order.contactPhone)}</p>
          {order.comment ? <p className="mt-2 text-muted">«{order.comment}»</p> : null}
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
          <h3 className="font-semibold">Состав</h3>
          <ul className="mt-2 space-y-1.5">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span>{i.nameAtPurchase} × {i.qty}</span>
                <span className="shrink-0">{formatPrice(i.priceAtPurchase * i.qty)}</span>
              </li>
            ))}
            <li className="flex justify-between text-muted"><span>Товары</span><span>{formatPrice(itemsTotal)}</span></li>
            <li className="flex justify-between text-muted"><span>Доставка</span><span>{order.deliveryPrice ? formatPrice(order.deliveryPrice) : "бесплатно"}</span></li>
            <li className="flex justify-between border-t border-border pt-2 font-bold"><span>Итого</span><span>{formatPrice(order.total)}</span></li>
          </ul>
        </div>
      </div>

      {["PENDING_PAYMENT", "PAID"].includes(order.status) ? (
        <form action={cancelMyOrder}>
          <input type="hidden" name="id" value={order.id} />
          <button className="text-sm text-danger hover:underline">Отменить заказ</button>
        </form>
      ) : null}
    </div>
  );
}
