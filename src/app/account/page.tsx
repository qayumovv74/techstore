import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { count, desc, eq } from "drizzle-orm";
import { ArrowRight, Camera, Heart, MapPin, Package, Phone, Star } from "lucide-react";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { formatPrice, pluralize } from "@/lib/format";
import { formatPhone } from "@/lib/validation";
import { getPendingReviews } from "@/lib/reviews";
import { PanelSkeleton } from "./skeleton";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui";
import { UserAvatar } from "@/components/ui/avatar";
import { GlowCard } from "@/components/ui/spotlight-card";
import { Hero3D } from "@/components/ui/hero-3d";
import { CountUp } from "@/components/count-up";
import { StatusBadge } from "@/components/order-timeline";

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
  const [[orders], [favorites], [addresses], profile, [lastOrder], toReview] = await Promise.all([
    db.select({ n: count() }).from(schema.orders).where(eq(schema.orders.userId, user.id)),
    db.select({ n: count() }).from(schema.favorites).where(eq(schema.favorites.userId, user.id)),
    db.select({ n: count() }).from(schema.addresses).where(eq(schema.addresses.userId, user.id)),
    db.query.users.findFirst({ where: eq(schema.users.id, user.id), columns: { phone: true, createdAt: true } }),
    db
      .select({ id: schema.orders.id, number: schema.orders.number, status: schema.orders.status, total: schema.orders.total, createdAt: schema.orders.createdAt })
      .from(schema.orders)
      .where(eq(schema.orders.userId, user.id))
      .orderBy(desc(schema.orders.createdAt))
      .limit(1),
    getPendingReviews(user.id, 4),
  ]);

  const tiles = [
    { href: "/account/orders", n: orders.n, label: pluralize(orders.n, ["заказ", "заказа", "заказов"]), icon: Package },
    { href: "/account/favorites", n: favorites.n, label: `${pluralize(favorites.n, ["товар", "товара", "товаров"])} в избранном`, icon: Heart },
    { href: "/account/addresses", n: addresses.n, label: pluralize(addresses.n, ["адрес", "адреса", "адресов"]), icon: MapPin },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* приветствие с аватаркой и 3D */}
      <section className="relative grid overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(120%_100%_at_85%_20%,rgb(61_44_141/0.7),rgb(4_5_46/0.6)_55%,rgb(2_1_10/0.8))] md:grid-cols-[1fr_300px]">
        <div className="relative z-10 flex flex-col gap-5 p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <Link href="/account/profile" className="group relative shrink-0" aria-label="Сменить фото профиля">
              <span aria-hidden className="absolute -inset-1.5 animate-[spin_8s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,#916bbf,#3d2c8d,#c4b5e8,#916bbf)] opacity-80 blur-[3px]" />
              <UserAvatar name={user.name} src={user.avatarUrl} className="relative size-20 text-3xl ring-2 ring-ink" />
              <span className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border border-white/20 bg-ink text-lilac transition-colors group-hover:bg-violet group-hover:text-ink">
                <Camera className="size-3.5" aria-hidden />
              </span>
            </Link>
            <div className="min-w-0">
              <p className="text-sm text-lilac">Здравствуйте,</p>
              <p className="truncate text-2xl font-bold sm:text-3xl">{user.name}</p>
            </div>
          </div>
          <div className="text-sm text-lilac/90">
            <p className="truncate">
              {user.email}
              {profile?.phone ? ` · ${formatPhone(profile.phone)}` : ""}
            </p>
            <p className="mt-1 text-xs text-lilac/70">
              С нами с {profile?.createdAt.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <Hero3D variant="account" className="-mt-6 h-48 md:mt-0 md:h-auto" />
      </section>

      <ul className="grid gap-3 sm:grid-cols-3">
        {tiles.map(({ href, n, label, icon: Icon }) => (
          <li key={href} className="flex">
            <GlowCard customSize className="w-full p-0">
              <Link href={href} className="group flex items-center justify-between gap-3 rounded-[18px] p-5">
                <div>
                  <CountUp value={n} className="text-3xl font-bold tabular-nums" />
                  <p className="mt-1 text-sm text-muted">{label}</p>
                </div>
                <span className="grid size-11 place-items-center rounded-2xl bg-violet/15 text-lilac transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <Icon className="size-5" aria-hidden />
                </span>
              </Link>
            </GlowCard>
          </li>
        ))}
      </ul>

      {lastOrder ? (
        <Link
          href={`/account/orders/${lastOrder.id}`}
          className="group flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-glass p-5 backdrop-blur-md transition-colors hover:border-violet/50"
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-muted">Последний заказ</p>
            <p className="mt-1 font-semibold">
              TS-{lastOrder.number} · {formatPrice(lastOrder.total)}
            </p>
            <p className="text-xs text-muted">{lastOrder.createdAt.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={lastOrder.status} />
            <ArrowRight className="size-5 text-lilac transition-transform group-hover:translate-x-1" aria-hidden />
          </div>
        </Link>
      ) : null}

      {toReview.length ? (
        <section className="rounded-3xl border border-white/10 bg-glass p-5 backdrop-blur-md">
          <h2 className="flex items-center gap-2 font-semibold">
            <Star className="size-4 fill-[#f5c26b] text-[#f5c26b]" aria-hidden /> Оцените покупки
          </h2>
          <p className="mt-1 text-sm text-muted">Ваш отзыв поможет другим выбрать.</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {toReview.map((p) => (
              <li key={p.id}>
                <Link href={`/product/${p.slug}#reviews`} className="flex items-center gap-3 rounded-2xl border border-white/10 p-2 pr-4 transition-colors hover:border-violet/50 hover:bg-violet/10">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-white">
                    {p.image ? <Image src={p.image} alt="" fill sizes="48px" className="object-cover" /> : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                  <span className="text-xs font-semibold text-lilac">Оценить →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {!profile?.phone ? (
          <Link href="/account/profile" className="flex items-center gap-3 rounded-3xl border border-dashed border-violet/60 bg-ink/50 p-5 text-sm backdrop-blur-md hover:bg-violet/10">
            <Phone className="size-5 shrink-0 text-lilac" aria-hidden />
            <span><span className="font-semibold text-lilac">Добавьте телефон</span> — курьер позвонит перед доставкой</span>
          </Link>
        ) : null}
        {!user.avatarUrl ? (
          <Link href="/account/profile" className="flex items-center gap-3 rounded-3xl border border-dashed border-violet/60 bg-ink/50 p-5 text-sm backdrop-blur-md hover:bg-violet/10">
            <Camera className="size-5 shrink-0 text-lilac" aria-hidden />
            <span><span className="font-semibold text-lilac">Поставьте аватарку</span> — она появится в шапке и рядом с отзывами</span>
          </Link>
        ) : null}
      </div>

      <form action={logout} className="lg:hidden">
        <Button variant="outline" className="w-full text-danger">Выйти из аккаунта</Button>
      </form>
    </div>
  );
}
