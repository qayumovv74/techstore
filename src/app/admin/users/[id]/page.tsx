import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth";
import { formatPrice, roleLabel, statusLabel } from "@/lib/format";
import { formatPhone } from "@/lib/validation";
import { msk } from "@/lib/datetime";

export const metadata: Metadata = { title: "Пользователь" };

const eventLabel = {
  REGISTER: "Регистрация",
  LOGIN: "Вход",
  LOGIN_FAILED: "Неверный пароль",
  PASSWORD_RESET: "Сброс пароля",
  PASSWORD_CHANGED: "Смена пароля",
  SESSIONS_REVOKED: "Выход на других устройствах",
  EMAIL_VERIFIED: "Почта подтверждена",
};

export default function UserPage({ params }: PageProps<"/admin/users/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface-2" />}>
      <User params={params} />
    </Suspense>
  );
}

async function User({ params }: { params: PageProps<"/admin/users/[id]">["params"] }) {
  await requireRole(["ADMIN"], "/admin/users");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, id),
    with: { addresses: true, orders: { orderBy: desc(schema.orders.createdAt), limit: 20 } },
  });
  if (!user) notFound();
  const events = await db.query.authEvents.findMany({
    where: eq(schema.authEvents.userId, id),
    orderBy: desc(schema.authEvents.createdAt),
    limit: 100,
  });

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/users" className="text-sm text-lilac hover:text-white">← Все пользователи</Link>
      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-xl font-bold">{user.name}</p>
        <p className="mt-1 text-sm text-muted">
          {user.email} · {formatPhone(user.phone) || "телефон не указан"} · {roleLabel[user.role]}
        </p>
        <p className="mt-1 text-sm text-muted">Аккаунт создан {msk(user.createdAt)}</p>
      </div>

      <section>
        <h2 className="font-semibold">Журнал входов</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-xs text-muted">
              <tr><th className="px-4 py-3 font-medium">Когда</th><th className="px-4 py-3 font-medium">Событие</th><th className="px-4 py-3 font-medium">IP</th><th className="px-4 py-3 font-medium">Устройство</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.length ? events.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2.5 whitespace-nowrap">{msk(e.createdAt)}</td>
                  <td className={`px-4 py-2.5 ${e.type === "LOGIN_FAILED" ? "text-danger" : ""}`}>{eventLabel[e.type]}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{e.ip ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs" title={e.userAgent ?? ""}>{e.device ?? "—"}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-muted">Событий пока нет</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-semibold">Заказы</h2>
        {user.orders.length ? (
          <ul className="mt-3 flex flex-col gap-2">
            {user.orders.map((o) => (
              <li key={o.id} className="flex justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm">
                <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:text-primary">TS-{o.number}</Link>
                <span className="text-muted">{statusLabel[o.status]}</span>
                <span>{formatPrice(o.total)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-muted">Заказов нет</p>}
      </section>
    </div>
  );
}
