import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { desc, ilike, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth";
import { roleLabel } from "@/lib/format";
import { msk } from "@/lib/datetime";
import { changeRole } from "./actions";

export const metadata: Metadata = { title: "Пользователи" };

export default function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface-2" />}>
      <Users searchParams={searchParams} />
    </Suspense>
  );
}

// Без join'ов drizzle пишет колонки без имени таблицы, и в подзапросе "id" указал бы на auth_events.id.
// Поэтому ссылку на users.id пишем явно.
const userId = sql.raw(`"users"."id"`);
const lastEvent = (type: "REGISTER" | "LOGIN", col: "created_at" | "ip" | "device") =>
  sql<string | null>`(select ${sql.raw(`e.${col}`)} from auth_events e
    where e.user_id = ${userId} and e.type = ${type} order by e.created_at desc limit 1)`;

async function Users({ searchParams }: { searchParams: PageProps<"/admin/users">["searchParams"] }) {
  const me = await requireRole(["ADMIN"], "/admin/users");
  const q = (await searchParams).q;
  const query = typeof q === "string" ? q.trim() : "";

  const rows = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
      regIp: lastEvent("REGISTER", "ip"),
      regDevice: lastEvent("REGISTER", "device"),
      lastLoginAt: sql<Date | null>`(select max(e.created_at) from auth_events e where e.user_id = ${userId} and e.type = 'LOGIN')`,
      lastIp: lastEvent("LOGIN", "ip"),
      lastDevice: lastEvent("LOGIN", "device"),
      orders: sql<number>`(select count(*)::int from orders o where o.user_id = ${userId})`,
    })
    .from(schema.users)
    .where(query ? or(ilike(schema.users.email, `%${query}%`), ilike(schema.users.name, `%${query}%`)) : undefined)
    .orderBy(desc(schema.users.createdAt))
    .limit(200);

  return (
    <div className="flex flex-col gap-4">
      <form className="flex max-w-md gap-2">
        <input name="q" defaultValue={query} placeholder="Имя или email" aria-label="Поиск пользователя"
          className="h-10 flex-1 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary" />
        <button className="h-10 rounded-xl border border-border px-4 text-sm hover:bg-surface-2">Найти</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-border text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Пользователь</th>
              <th className="px-4 py-3 font-medium">Регистрация</th>
              <th className="px-4 py-3 font-medium">Последний вход</th>
              <th className="px-4 py-3 font-medium">Заказы</th>
              <th className="px-4 py-3 font-medium">Роль</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border align-top">
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${u.id}`} className="font-semibold hover:text-primary">{u.name}</Link>
                  <p className="text-xs text-muted">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{msk(u.createdAt)}</p>
                  <p className="text-xs text-muted">{u.regIp ?? "—"}</p>
                  <p className="text-xs text-muted">{u.regDevice ?? "—"}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{u.lastLoginAt ? msk(new Date(u.lastLoginAt)) : "—"}</p>
                  <p className="text-xs text-muted">{u.lastIp ?? ""}</p>
                  <p className="text-xs text-muted">{u.lastDevice ?? ""}</p>
                </td>
                <td className="px-4 py-3">{u.orders}</td>
                <td className="px-4 py-3">
                  {u.id === me.id ? (
                    <span>{roleLabel[u.role]} (вы)</span>
                  ) : (
                    <form action={changeRole} className="flex gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <select name="role" defaultValue={u.role} aria-label={`Роль ${u.name}`}
                        className="h-9 rounded-lg border border-border bg-bg px-2 text-sm">
                        {Object.entries(roleLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      <button className="h-9 rounded-lg border border-border px-3 text-xs hover:bg-surface-2">OK</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        IP и устройство пишутся при регистрации и каждом входе. Локально IP всегда 127.0.0.1 — настоящие адреса появятся на сервере за Nginx.
      </p>
    </div>
  );
}
