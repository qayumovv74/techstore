import Link from "next/link";
import { Suspense } from "react";
import { getCatalog, getCategories, parseFilters } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { ProductArt } from "@/components/product-art";
import { getFavoriteIds } from "@/lib/favorites";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-ink to-deep p-6 text-white sm:p-12 dark:border dark:border-border dark:from-deep dark:via-ink">
        <div aria-hidden className="absolute -right-24 -top-24 size-80 rounded-full bg-teal/30 blur-3xl" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-sky">{"// новинки осени"}</p>
        <h1 className="relative mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
          Техника, которая <span className="text-aqua">работает на вас</span>
        </h1>
        <p className="relative mt-4 max-w-lg text-sm text-sky sm:text-base">
          Официальная гарантия, доставка по Москве за 1 день и статус заказа в реальном времени.
        </p>
        <form action="/catalog" role="search" className="relative mt-6 hidden max-w-md gap-2 md:flex">
          <label className="sr-only" htmlFor="hero-search">Поиск</label>
          <input id="hero-search" name="q" type="search" placeholder="Что ищем?"
            className="h-11 min-w-0 flex-1 rounded-xl border border-slate bg-deep px-3.5 text-sm text-white placeholder:text-sky/70 outline-none focus:border-aqua" />
          <button className="h-11 rounded-xl bg-aqua px-5 text-sm font-semibold text-ink hover:bg-sky">Найти</button>
        </form>
      </section>

      <Suspense fallback={<GridSkeleton />}>
        <Sections />
      </Suspense>
    </main>
  );
}

async function Sections() {
  const [categories, favs] = await Promise.all([getCategories(), getFavoriteIds()]);
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
                <ProductCard p={p} favored={favs.has(p.id)} />
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
