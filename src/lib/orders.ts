import "server-only";
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { OrderStatus } from "@/db/schema";
import { sendMail } from "@/lib/mail";
import { orderCreatedMail, orderPaidMail, orderStatusMail } from "@/lib/mail/templates";
import { createPayment } from "@/lib/payments/mock";
import { CHANNEL } from "@/lib/realtime";

export const RESERVE_MINUTES = 15;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Событие для живых обновлений. NOTIFY внутри транзакции уходит только после commit. */
async function publish(tx: Tx, order: { id: string; userId: string }, status: OrderStatus) {
  const payload = JSON.stringify({ topic: "orders", orderId: order.id, userId: order.userId, status });
  await tx.execute(sql`select pg_notify(${CHANNEL}, ${payload})`);
}

/** Куда можно перевести заказ вручную (менеджер/админ). В «Оплачен» — только через платёж. */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  PAID: ["ASSEMBLING", "CANCELLED"],
  ASSEMBLING: ["SHIPPING", "CANCELLED"],
  SHIPPING: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export class OrderError extends Error {}

export type PlaceOrderInput = {
  userId: string;
  lines: { productId: string; qty: number }[];
  contactName: string;
  contactPhone: string;
  deliveryMethod: "COURIER" | "PICKUP";
  deliveryPrice: number;
  address: { city: string; street: string; apartment?: string | null; comment?: string | null };
  comment?: string | null;
};

/**
 * Создаёт заказ и резервирует товар. Всё в одной транзакции:
 * строки остатков блокируются (FOR UPDATE), поэтому два покупателя
 * не смогут одновременно купить последний экземпляр.
 */
export async function placeOrder(input: PlaceOrderInput) {
  await releaseExpiredReservations();
  if (!input.lines.length) throw new OrderError("Корзина пуста");

  const ids = input.lines.map((l) => l.productId);
  const result = await db.transaction(async (tx) => {
    const rows = await tx
      .select({
        id: schema.products.id,
        name: schema.products.name,
        brand: schema.products.brand,
        price: schema.products.price,
        isActive: schema.products.isActive,
        quantity: schema.stock.quantity,
        reserved: schema.stock.reserved,
      })
      .from(schema.products)
      .innerJoin(schema.stock, eq(schema.stock.productId, schema.products.id))
      .where(inArray(schema.products.id, ids))
      .orderBy(schema.products.id) // одинаковый порядок блокировок — без взаимных блокировок
      .for("update", { of: schema.stock });

    const byId = new Map(rows.map((r) => [r.id, r]));
    for (const line of input.lines) {
      const p = byId.get(line.productId);
      if (!p || !p.isActive) throw new OrderError("Один из товаров больше не продаётся — обновите корзину");
      if (p.quantity - p.reserved < line.qty) {
        throw new OrderError(`«${p.name}»: в наличии только ${Math.max(0, p.quantity - p.reserved)} шт.`);
      }
    }

    const items = input.lines.map((l) => {
      const p = byId.get(l.productId)!;
      return { productId: p.id, nameAtPurchase: `${p.brand} ${p.name}`, priceAtPurchase: p.price, qty: l.qty };
    });
    const total = items.reduce((s, i) => s + i.priceAtPurchase * i.qty, 0) + input.deliveryPrice;

    const [order] = await tx
      .insert(schema.orders)
      .values({
        userId: input.userId,
        total,
        deliveryMethod: input.deliveryMethod,
        deliveryPrice: input.deliveryPrice,
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        comment: input.comment || null,
        addressSnapshot: input.address,
        reservedUntil: new Date(Date.now() + RESERVE_MINUTES * 60_000),
      })
      .returning();

    await tx.insert(schema.orderItems).values(items.map((i) => ({ ...i, orderId: order.id })));
    for (const i of items) {
      await tx
        .update(schema.stock)
        .set({ reserved: sql`${schema.stock.reserved} + ${i.qty}` })
        .where(eq(schema.stock.productId, i.productId));
    }

    const payment = createPayment();
    await tx.insert(schema.payments).values({ orderId: order.id, amount: total, ...payment });
    await tx.insert(schema.orderEvents).values({ orderId: order.id, toStatus: "PENDING_PAYMENT", actorId: input.userId });
    await tx.delete(schema.cartItems).where(eq(schema.cartItems.userId, input.userId));
    await publish(tx, order, "PENDING_PAYMENT");

    return { order, items, payUrl: payment.payUrl };
  });

  void notify(result.order.id, "created");
  return result;
}

/** Снимает резерв с неоплаченных за 15 минут заказов. Вызывается на ходу и по cron. */
export async function releaseExpiredReservations() {
  const expired = await db
    .select({ id: schema.orders.id })
    .from(schema.orders)
    .where(and(eq(schema.orders.status, "PENDING_PAYMENT"), lt(schema.orders.reservedUntil, new Date())));
  for (const { id } of expired) {
    await db.transaction((tx) => cancelInTx(tx, id, null, "PENDING_PAYMENT"));
  }
  return expired.length;
}

async function lockOrder(tx: Tx, orderId: string) {
  const [order] = await tx.select().from(schema.orders).where(eq(schema.orders.id, orderId)).for("update");
  return order;
}

async function cancelInTx(tx: Tx, orderId: string, actorId: string | null, expected?: OrderStatus) {
  const order = await lockOrder(tx, orderId);
  if (!order || (expected && order.status !== expected) || !NEXT_STATUSES[order.status].includes("CANCELLED")) return false;

  const items = await tx.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
  for (const i of items) {
    // до оплаты товар был в резерве, после — уже списан со склада
    const set =
      order.status === "PENDING_PAYMENT"
        ? { reserved: sql`greatest(${schema.stock.reserved} - ${i.qty}, 0)` }
        : { quantity: sql`${schema.stock.quantity} + ${i.qty}` };
    await tx.update(schema.stock).set(set).where(eq(schema.stock.productId, i.productId));
  }
  const wasPaid = order.status !== "PENDING_PAYMENT";
  await tx
    .update(schema.payments)
    .set({ status: wasPaid ? "REFUNDED" : "FAILED" })
    .where(and(eq(schema.payments.orderId, orderId), eq(schema.payments.status, wasPaid ? "PAID" : "PENDING")));
  await tx.update(schema.orders).set({ status: "CANCELLED", reservedUntil: null }).where(eq(schema.orders.id, orderId));
  await tx.insert(schema.orderEvents).values({ orderId, fromStatus: order.status, toStatus: "CANCELLED", actorId });
  await publish(tx, order, "CANCELLED");
  return true;
}

/** Ручная смена статуса менеджером или отмена покупателем */
export async function changeStatus(orderId: string, to: OrderStatus, actorId: string) {
  const changed = await db.transaction(async (tx) => {
    if (to === "CANCELLED") return cancelInTx(tx, orderId, actorId);
    const order = await lockOrder(tx, orderId);
    if (!order || !NEXT_STATUSES[order.status].includes(to)) return false;
    await tx.update(schema.orders).set({ status: to }).where(eq(schema.orders.id, orderId));
    await tx.insert(schema.orderEvents).values({ orderId, fromStatus: order.status, toStatus: to, actorId });
    await publish(tx, order, to);
    return true;
  });
  if (changed) void notify(orderId, "status");
  return changed;
}

/**
 * Обработка уведомления от шлюза. Идемпотентно: повторный вебхук
 * (шлюзы так делают, если не дождались ответа) ничего не испортит.
 */
export async function applyPaymentResult(externalId: string, amount: number, succeeded: boolean) {
  const outcome = await db.transaction(async (tx) => {
    const [payment] = await tx.select().from(schema.payments).where(eq(schema.payments.externalId, externalId)).for("update");
    if (!payment) return "unknown" as const;
    if (payment.status !== "PENDING") return "duplicate" as const;
    if (payment.amount !== amount) return "amount_mismatch" as const;

    const order = await lockOrder(tx, payment.orderId);

    if (!succeeded) {
      // Отказ банка: заказ ждёт повторной оплаты, пока не истечёт резерв
      await tx.update(schema.payments).set({ status: "FAILED" }).where(eq(schema.payments.id, payment.id));
      const retry = createPayment();
      await tx.insert(schema.payments).values({ orderId: order.id, amount: payment.amount, ...retry }).onConflictDoNothing();
      await publish(tx, order, order.status);
      return "failed" as const;
    }

    if (order.status !== "PENDING_PAYMENT") {
      // Деньги пришли, а резерв уже снят — возвращаем (в реальном шлюзе тут вызов refund API)
      await tx.update(schema.payments).set({ status: "REFUNDED" }).where(eq(schema.payments.id, payment.id));
      return "refunded" as const;
    }

    const items = await tx.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
    for (const i of items) {
      await tx
        .update(schema.stock)
        .set({
          quantity: sql`${schema.stock.quantity} - ${i.qty}`,
          reserved: sql`greatest(${schema.stock.reserved} - ${i.qty}, 0)`,
        })
        .where(eq(schema.stock.productId, i.productId));
    }
    await tx.update(schema.payments).set({ status: "PAID" }).where(eq(schema.payments.id, payment.id));
    await tx.update(schema.orders).set({ status: "PAID", reservedUntil: null }).where(eq(schema.orders.id, order.id));
    await tx.insert(schema.orderEvents).values({ orderId: order.id, fromStatus: "PENDING_PAYMENT", toStatus: "PAID" });
    await publish(tx, order, "PAID");
    return { paidOrderId: order.id };
  });

  if (typeof outcome === "object") void notify(outcome.paidOrderId, "paid");
  return typeof outcome === "object" ? "paid" : outcome;
}

async function notify(orderId: string, kind: "created" | "paid" | "status") {
  const order = await db.query.orders.findFirst({
    where: eq(schema.orders.id, orderId),
    with: { items: true, user: { columns: { email: true } } },
  });
  if (!order) return;
  const data = {
    id: order.id,
    number: order.number,
    total: order.total,
    status: order.status,
    items: order.items.map((i) => ({ name: i.nameAtPurchase, qty: i.qty, price: i.priceAtPurchase })),
  };
  const mail = kind === "created" ? orderCreatedMail(data) : kind === "paid" ? orderPaidMail(data) : orderStatusMail(data);
  await sendMail(order.user.email, mail.subject, mail.html, mail.text);
}

/** Актуальный (последний неоплаченный) платёж заказа — для кнопки «Оплатить» */
export async function pendingPayment(orderId: string) {
  return db.query.payments.findFirst({
    where: and(eq(schema.payments.orderId, orderId), eq(schema.payments.status, "PENDING")),
  });
}
