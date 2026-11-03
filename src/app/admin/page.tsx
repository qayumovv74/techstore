import type { Metadata } from "next";
import { Suspense } from "react";
import { count, lte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireRole, STAFF_ROLES } from "@/lib/auth";
import { roleLabel } from "@/lib/format";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Админка" };

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-surface-2" />}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

async function Dashboard() {
  const user = await requireRole(STAFF_ROLES, "/admin");

  const [[products], [users], [orders], [lowStock]] = await Promise.all([
    db.select({ n: count() }).from(schema.products),
    db.select({ n: count() }).from(schema.users),
    db.select({ n: count() }).from(schema.orders),
    db
      .select({ n: count() })
      .from(schema.stock)
      .where(lte(sql`${schema.stock.quantity} - ${schema.stock.reserved}`, 3)),
  ]);

  const tiles = [
    { label: "Товаров", value: products.n },
    { label: "Пользователей", value: users.n },
    { label: "Заказов", value: orders.n },
    { label: "Заканчиваются (≤ 3 шт.)", value: lowStock.n, warn: lowStock.n > 0 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Дашборд</h1>
        <p className="text-sm text-muted">
          {user.name} · {roleLabel[user.role]}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-5">
            <p className="text-sm text-muted">{t.label}</p>
            <p className={`mt-1 text-3xl font-bold ${t.warn ? "text-danger" : ""}`}>{t.value}</p>
          </Card>
        ))}
      </div>
      <Card>
        <p className="text-sm text-muted">Графики выручки и живая лента заказов появятся на этапах 4–5.</p>
      </Card>
    </div>
  );
}
