import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getCatalog, getCategories, parseFilters } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { ProductArt } from "@/components/product-art";
import { getFavoriteIds } from "@/lib/favorites";
import { getCartIds } from "@/lib/cart";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <section className="relative overflow-hidden rounded-3xl bg-black px-6 py-10 text-white sm:px-12 sm:py-14">
        <Image
          src="/brand/mark-silver.png"
          alt=""
          width={730}
          height={372}
          priority
          className="pointer-events-none absolute -right-16 bottom-6 w-[380px] opacity-25 sm:right-10 sm:top-1/2 sm:w-[440px] sm:-translate-y-1/2 sm:opacity-100"
        />
        <div className="relative max-w-xl">
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">Электроника с официальной гарантией</h1>
          <p className="mt-4 text-sm text-sky sm:text-base">
            Смартфоны, ноутбуки, наушники и гаджеты. Курьер привезёт завтра, а из пункта выдачи можно забрать уже сегодня.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/catalog" className="inline-flex h-11 items-center rounded-xl bg-white px-6 text-sm font-semibold text-ink hover:bg-sky">
              Перейти в каталог
            </Link>
            <Link href="/catalog?category=smartphones" className="inline-flex h-11 items-center rounded-xl border border-white/30 px-6 text-sm font-semibold hover:border-white">
              Смартфоны
            </Link>
          </div>
        </div>
      </section>

      <Suspense fallback={<GridSkeleton />}>
        <Sections />
      </Suspense>
    </main>
  );
}

async function Sections() {
  const [categories, favs, cartIds] = await Promise.all([getCategories(), getFavoriteIds(), getCartIds()]);
  const sections = await Promise.all(
    categories.map(async (c) => ({ c, data: await getCatalog(parseFilters({ category: c.slug, stock: "1" })) })),
  );

  return (
    <div className="mt-8 flex flex-col gap-12">
      <nav aria-label="Категории">
        <ul className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0">
          {categories.map((c) => (
            <li key={c.id} className="w-28 shrink-0 snap-start sm:w-auto">
              <Link href={`/catalog?category=${c.slug}`}
                className="flex h-full flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-3 text-center text-xs font-semibold transition-colors hover:border-primary sm:text-sm">
                <ProductArt category={c.slug} brand="" className="aspect-[4/3] w-full rounded-xl" />
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {sections.map(({ c, data }) => (
        <section key={c.id} aria-labelledby={`cat-${c.slug}`}>
          <div className="flex items-baseline justify-between gap-4">
            <h2 id={`cat-${c.slug}`} className="text-xl font-bold">{c.name}</h2>
            <Link href={`/catalog?category=${c.slug}`} className="text-sm font-semibold text-primary hover:text-primary-hover">
              Смотреть все →
            </Link>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {data.products.slice(0, 4).map((p) => (
              <li key={p.id} className="flex">
                <ProductCard p={p} favored={favs.has(p.id)} inCart={cartIds.has(p.id)} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-surface-2" />
      ))}
    </div>
  );
}
