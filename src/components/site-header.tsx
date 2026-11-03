import Link from "next/link";
import { Suspense } from "react";
import { asc, count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser, STAFF_ROLES } from "@/lib/auth";
import { CatalogMenu } from "./catalog-menu";
import { IconCart, IconGrid, IconHeart, IconPin, IconSearch, IconUser } from "./icons";
import { Logo } from "./logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
      {/* Верхняя полоса: город и сервисная информация */}
      <div className="hidden border-b border-border/60 text-xs text-muted md:block">
        <div className="mx-auto flex h-9 max-w-6xl items-center gap-6 px-4">
          <span className="inline-flex items-center gap-1.5 font-medium text-text">
            <IconPin className="size-4 text-primary" /> Москва
          </span>
          <span>Доставка завтра · Самовывоз сегодня</span>
          <span>Рассрочка 0-0-12</span>
          <span className="ml-auto">Пн–Вс 9:00–21:00</span>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:h-[72px] md:gap-4">
        <Logo className="h-7 md:h-9" />

        <div className="hidden md:block">
          <Suspense fallback={<CatalogFallback />}>
            <CatalogButton />
          </Suspense>
        </div>

        <form action="/catalog" role="search" className="relative hidden flex-1 md:block">
          <label className="sr-only" htmlFor="site-search">Поиск по каталогу</label>
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <input id="site-search" name="q" type="search" placeholder="Поиск: iPhone, наушники, ноутбук…"
            className="h-11 w-full rounded-xl border border-border bg-surface pl-11 pr-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25" />
        </form>

        <div className="ml-auto md:ml-0">
          <Suspense fallback={<div className="h-11 w-48 animate-pulse rounded-xl bg-surface-2" />}>
            <UserArea />
          </Suspense>
        </div>
      </div>

      <form action="/catalog" role="search" className="relative px-4 pb-3 md:hidden">
        <label className="sr-only" htmlFor="site-search-mobile">Поиск по каталогу</label>
        <IconSearch className="pointer-events-none absolute left-7 top-[calc(50%-6px)] size-5 -translate-y-1/2 text-muted" />
        <input id="site-search-mobile" name="q" type="search" placeholder="Поиск по каталогу"
          className="h-11 w-full rounded-xl border border-border bg-surface pl-11 pr-3.5 text-sm outline-none focus:border-primary" />
      </form>
    </header>
  );
}

function CatalogFallback() {
  return (
    <Link href="/catalog" className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary">
      <IconGrid className="size-5" /> Каталог
    </Link>
  );
}

async function CatalogButton() {
  const rows = await db
    .select({ slug: schema.categories.slug, name: schema.categories.name, count: count(schema.products.id) })
    .from(schema.categories)
    .leftJoin(schema.products, eq(schema.products.categoryId, schema.categories.id))
    .groupBy(schema.categories.id)
    .orderBy(asc(schema.categories.name));
  return <CatalogMenu categories={rows} />;
}

function HeaderIcon({ href, label, badge, children }: { href: string; label: string; badge?: number; children: React.ReactNode }) {
  return (
    <Link href={href} className="relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[11px] text-muted hover:text-primary">
      {children}
      <span className="hidden md:block">{label}</span>
      {badge ? (
        <span className="absolute -top-0.5 right-0 grid min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold leading-5 text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

async function UserArea() {
  const user = await getCurrentUser();
  const favCount = user
    ? (await db.select({ n: count() }).from(schema.favorites).where(eq(schema.favorites.userId, user.id)))[0].n
    : 0;

  return (
    <div className="flex items-center gap-1 md:gap-2">
      <div className="hidden items-center gap-1 md:flex">
        {user && STAFF_ROLES.includes(user.role) ? (
          <Link href="/admin" className="mr-2 rounded-lg border border-primary px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-on-primary">
            Админка
          </Link>
        ) : null}
        <HeaderIcon href="/account/favorites" label="Избранное" badge={favCount}>
          <IconHeart className="size-6" />
        </HeaderIcon>
        <HeaderIcon href="/cart" label="Корзина">
          <IconCart className="size-6" />
        </HeaderIcon>
      </div>
      <HeaderIcon href={user ? "/account" : "/login"} label={user ? user.name.split(" ")[0] : "Войти"}>
        <IconUser className="size-6" />
      </HeaderIcon>
    </div>
  );
}
