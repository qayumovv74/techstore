import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

// Всё считается по факту оплаты (событие «Оплачен»), в московском времени.
// Отменённые после оплаты заказы в выручку не входят.

type Row = Record<string, unknown>;
const rows = async <T,>(q: ReturnType<typeof sql>) => (await db.execute(q)).rows as unknown as T[];

const paidOrders = sql`
  select o.id, o.total, e.created_at as paid_at
  from orders o
  join order_events e on e.order_id = o.id and e.to_status = 'PAID'
  where o.status <> 'CANCELLED'`;

export async function revenueByDay(days = 14) {
  return rows<{ day: string; revenue: number; orders: number }>(sql`
    with d as (
      select generate_series(
        (now() at time zone 'Europe/Moscow')::date - ${days - 1}::int,
        (now() at time zone 'Europe/Moscow')::date,
        interval '1 day')::date as day
    ), p as (${paidOrders})
    select to_char(d.day, 'YYYY-MM-DD') as day,
           coalesce(sum(p.total), 0)::bigint::float8 as revenue,
           count(p.id)::int as orders
    from d left join p on (p.paid_at at time zone 'Europe/Moscow')::date = d.day
    group by d.day order by d.day`);
}

export async function summary() {
  const [r] = await rows<Row>(sql`
    with p as (${paidOrders}),
    today as (select * from p where (paid_at at time zone 'Europe/Moscow')::date = (now() at time zone 'Europe/Moscow')::date),
    yesterday as (select * from p where (paid_at at time zone 'Europe/Moscow')::date = (now() at time zone 'Europe/Moscow')::date - 1),
    month as (select * from p where paid_at > now() - interval '30 days')
    select
      (select coalesce(sum(total), 0)::float8 from today) as today_revenue,
      (select count(*)::int from today) as today_orders,
      (select coalesce(sum(total), 0)::float8 from yesterday) as yesterday_revenue,
      (select coalesce(sum(total), 0)::float8 from month) as month_revenue,
      (select count(*)::int from month) as month_orders,
      (select count(*)::int from orders where status = 'PAID') as to_assemble,
      (select count(*)::int from orders where status = 'ASSEMBLING') as assembling,
      (select count(*)::int from orders where status = 'SHIPPING') as shipping,
      (select count(*)::int from orders where status = 'PENDING_PAYMENT') as awaiting_payment,
      (select count(*)::int from orders where status = 'CANCELLED' and updated_at > now() - interval '30 days') as cancelled_month,
      (select count(*)::int from users where role = 'CUSTOMER') as customers,
      (select count(*)::int from users where role = 'CUSTOMER' and created_at > now() - interval '7 days') as new_customers,
      (select count(distinct user_id)::int from orders o where exists
         (select 1 from order_events e where e.order_id = o.id and e.to_status = 'PAID')) as buyers`);
  const n = (k: string) => Number(r[k] ?? 0);
  return {
    todayRevenue: n("today_revenue"),
    todayOrders: n("today_orders"),
    yesterdayRevenue: n("yesterday_revenue"),
    monthRevenue: n("month_revenue"),
    monthOrders: n("month_orders"),
    avgCheck: n("month_orders") ? Math.round(n("month_revenue") / n("month_orders")) : 0,
    toAssemble: n("to_assemble"),
    assembling: n("assembling"),
    shipping: n("shipping"),
    awaitingPayment: n("awaiting_payment"),
    cancelledMonth: n("cancelled_month"),
    customers: n("customers"),
    newCustomers: n("new_customers"),
    buyers: n("buyers"),
  };
}

export async function topProducts(limit = 5) {
  return rows<{ name: string; slug: string | null; units: number; revenue: number }>(sql`
    select i.name_at_purchase as name, pr.slug,
           sum(i.qty)::int as units, sum(i.qty * i.price_at_purchase)::float8 as revenue
    from order_items i
    join orders o on o.id = i.order_id and o.status <> 'CANCELLED'
    left join products pr on pr.id = i.product_id
    where exists (select 1 from order_events e where e.order_id = o.id and e.to_status = 'PAID' and e.created_at > now() - interval '30 days')
    group by i.name_at_purchase, pr.slug
    order by units desc, revenue desc
    limit ${limit}`);
}

export async function lowStock(limit = 8) {
  return rows<{ id: string; name: string; brand: string; available: number }>(sql`
    select p.id, p.name, p.brand, (s.quantity - s.reserved)::int as available
    from stock s join products p on p.id = s.product_id
    where p.is_active and s.quantity - s.reserved <= 3
    order by available asc, p.name
    limit ${limit}`);
}
