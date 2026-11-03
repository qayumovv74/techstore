import Link from "next/link";
import { Suspense } from "react";
import { asc, count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser, STAFF_ROLES } from "@/lib/auth";
import { CatalogMenu } from "./catalog-menu";
import { CityPicker } from "./city-picker";
import { getCity } from "@/lib/city";
import { deliveryInfo } from "@/data/cities";
import { getCartCount } from "@/lib/cart";
import { IconCart, IconGrid, IconHeart, IconSearch, IconUser } from "./icons";
import { Logo } from "./logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
      <div className="hidden border-b border-border/60 text-xs text-muted md:block">
        <div className="mx-auto flex h-9 max-w-6xl items-center gap-6 px-4">
          <Suspense fallback={<span className="font-medium text-text">Москва</span>}>
            <CityBar />
          </Suspense>
          <Link href="/installment" className="hover:text-primary">Рассрочка 0-0-12</Link>
          <Link href="/contacts" className="ml-auto hover:text-primary">Пн–Вс 9:00–21:00 · Контакты</Link>
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

      <div className="flex items-center gap-3 px-4 pb-2 text-xs text-muted md:hidden">
        <Suspense fallback={<span className="font-medium text-text">Москва</span>}>
          <CityBar />
        </Suspense>
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

async function CityBar() {
  const city = await getCity();
  const d = deliveryInfo(city);
  return (
    <>
      <CityPicker city={city} />
      <Link href="/delivery" className="hover:text-primary">
        Доставка {d.courier} · Самовывоз {d.pickup}
      </Link>
    </>
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
  const [favCount, cartCount] = await Promise.all([
    user
      ? db.select({ n: count() }).from(schema.favorites).where(eq(schema.favorites.userId, user.id)).then((r) => r[0].n)
      : 0,
    getCartCount(),
  ]);

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
        <HeaderIcon href="/cart" label="Корзина" badge={cartCount}>
          <IconCart className="size-6" />
        </HeaderIcon>
      </div>
      <HeaderIcon href={user ? "/account" : "/login"} label={user ? user.name.split(" ")[0] : "Войти"}>
        <IconUser className="size-6" />
      </HeaderIcon>
    </div>
  );
}
