import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { pluralize } from "@/lib/format";
import { formatPhone } from "@/lib/validation";
import { PanelSkeleton } from "./skeleton";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui";

export const metadata: Metadata = { title: "Личный кабинет" };

export default function AccountPage() {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const user = await requireUser("/account");
  const [[orders], [favorites], [addresses], profile] = await Promise.all([
    db.select({ n: count() }).from(schema.orders).where(eq(schema.orders.userId, user.id)),
    db.select({ n: count() }).from(schema.favorites).where(eq(schema.favorites.userId, user.id)),
    db.select({ n: count() }).from(schema.addresses).where(eq(schema.addresses.userId, user.id)),
    db.query.users.findFirst({ where: eq(schema.users.id, user.id), columns: { phone: true, createdAt: true } }),
  ]);

  const tiles = [
    { href: "/account/orders", n: orders.n, label: pluralize(orders.n, ["заказ", "заказа", "заказов"]) },
    { href: "/account/favorites", n: favorites.n, label: `${pluralize(favorites.n, ["товар", "товара", "товаров"])} в избранном` },
    { href: "/account/addresses", n: addresses.n, label: pluralize(addresses.n, ["адрес", "адреса", "адресов"]) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-white/10 bg-linear-to-br from-indigo/70 via-night/80 to-ink/80 p-6 text-white backdrop-blur-md">
        <p className="text-sm text-lilac">Здравствуйте,</p>
        <p className="mt-1 text-2xl font-bold">{user.name}</p>
        <p className="mt-3 text-sm text-lilac">
          {user.email}
          {profile?.phone ? ` · ${formatPhone(profile.phone)}` : ""}
        </p>
        <p className="mt-1 text-xs text-lilac/70">
          С нами с {profile?.createdAt.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="block rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-primary">
              <p className="text-3xl font-bold">{t.n}</p>
              <p className="mt-1 text-sm text-muted">{t.label}</p>
            </Link>
          </li>
        ))}
      </ul>

      {!profile?.phone ? (
        <Link href="/account/profile" className="rounded-2xl border border-dashed border-primary p-5 text-sm hover:bg-surface-2">
          <span className="font-semibold text-primary">Добавьте телефон</span> — курьер позвонит перед доставкой →
        </Link>
      ) : null}

      <form action={logout} className="lg:hidden">
        <Button variant="outline" className="w-full text-danger">Выйти из аккаунта</Button>
      </form>
    </div>
  );
}
