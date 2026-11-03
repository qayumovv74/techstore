import Link from "next/link";
import { Suspense } from "react";
import { getCatalog, getCategories, parseFilters } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <section className="relative overflow-hidden rounded-3xl bg-ink p-8 text-white sm:p-12">
        <div aria-hidden className="absolute -right-24 -top-24 size-80 rounded-full bg-teal/30 blur-3xl" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-sky">{"// новинки осени"}</p>
        <h1 className="relative mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
          Техника, которая <span className="text-aqua">работает на вас</span>
        </h1>
        <p className="relative mt-4 max-w-lg text-sm text-sky sm:text-base">
          Официальная гарантия, доставка по Москве за 1 день и статус заказа в реальном времени.
        </p>
        <form action="/catalog" role="search" className="relative mt-6 flex max-w-md gap-2">
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
  const categories = await getCategories();
  const sections = await Promise.all(
    categories.map(async (c) => ({ c, data: await getCatalog(parseFilters({ category: c.slug, stock: "1" })) })),
  );

  return (
    <div className="mt-12 flex flex-col gap-12">
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
                <ProductCard p={p} />
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
