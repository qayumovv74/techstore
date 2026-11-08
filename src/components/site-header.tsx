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
import { IconGrid, IconSearch } from "./icons";
import { Logo } from "./logo";
import { MainNav } from "./main-nav";
import { buttonVariants } from "./ui/button-variants";

const searchInput =
  "h-11 w-full rounded-full border border-border bg-text/5 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-muted/70 focus:border-violet/70 focus:bg-violet/10";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-ink/55 backdrop-blur-xl">
      <div className="hidden border-b border-white/5 text-xs text-muted md:block">
        <div className="mx-auto flex h-9 max-w-6xl items-center gap-6 px-4">
          <Suspense fallback={<span className="font-medium text-text">Москва</span>}>
            <CityBar />
          </Suspense>
          <Link href="/installment" className="hover:text-lilac">Рассрочка 0-0-12</Link>
          <Link href="/support" className="ml-auto hover:text-lilac">Поддержка</Link>
          <Link href="/contacts" className="hover:text-lilac">Пн–Вс 9:00–21:00 · Контакты</Link>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:h-[76px] md:gap-4">
        <Logo className="h-7 md:h-8" />

        <div className="hidden md:block">
          <Suspense fallback={<CatalogFallback />}>
            <CatalogButton />
          </Suspense>
        </div>

        <form action="/catalog" role="search" className="relative hidden flex-1 md:block">
          <label className="sr-only" htmlFor="site-search">Поиск по каталогу</label>
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <input id="site-search" name="q" type="search" placeholder="Поиск: iPhone, наушники, ноутбук…" className={searchInput} />
        </form>

        <div className="ml-auto md:ml-0">
          <Suspense fallback={<NavFallback />}>
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
        <IconSearch className="pointer-events-none absolute left-8 top-[calc(50%-6px)] size-5 -translate-y-1/2 text-muted" />
        <input id="site-search-mobile" name="q" type="search" placeholder="Поиск по каталогу" className={searchInput} />
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
      <Link href="/delivery" className="hover:text-lilac">
        Доставка {d.courier} · Самовывоз {d.pickup}
      </Link>
    </>
  );
}

function CatalogFallback() {
  return (
    <Link href="/catalog" className={buttonVariants({ className: "font-semibold" })}>
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

function NavFallback() {
  return (
    <div className="hidden md:block">
      <MainNav variant="desktop" userName={null} favCount={0} cartCount={0} />
    </div>
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
  const staff = user && STAFF_ROLES.includes(user.role);

  return (
    <div className="flex items-center gap-2">
      {staff ? (
        <Link href="/admin" className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full border-violet/60 text-lilac" })}>
          Админка
        </Link>
      ) : null}
      <div className="hidden md:block">
        <MainNav variant="desktop" userName={user?.name ?? null} avatarUrl={user?.avatarUrl} favCount={favCount} cartCount={cartCount} />
      </div>
    </div>
  );
}
