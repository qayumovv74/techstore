import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getCatalog, getCategories, parseFilters, SORTS, type CatalogFilters, type Sort } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { getFavoriteIds } from "@/lib/favorites";
import { getCartIds } from "@/lib/cart";
import { catalogHref } from "./url";
import { SortSelect } from "./sort-select";

export const metadata: Metadata = { title: "Каталог" };

export default function CatalogPage({ searchParams }: PageProps<"/catalog">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Catalog({ searchParams }: { searchParams: PageProps<"/catalog">["searchParams"] }) {
  const f = parseFilters(await searchParams);
  const [data, categories, favs, cartIds] = await Promise.all([getCatalog(f), getCategories(), getFavoriteIds(), getCartIds()]);
  const title = f.q ? `Поиск: «${f.q}»` : (data.category?.name ?? "Все товары");

  return (
    <>
      <nav aria-label="Хлебные крошки" className="text-xs text-muted">
        <Link href="/" className="hover:text-primary">Главная</Link> / <span>Каталог</span>
      </nav>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold sm:text-3xl">
          {title} <span className="text-base font-normal text-muted">{data.total}</span>
        </h1>
        <SortSelect
          value={f.sort}
          options={SORTS}
          hrefs={Object.fromEntries(Object.keys(SORTS).map((s) => [s, catalogHref(f, { sort: s as Sort })]))}
        />
      </div>

      <ul className="mt-5 flex gap-2 overflow-x-auto pb-1">
        <Chip href={catalogHref(f, { category: undefined, brands: [] })} active={!f.category}>Все</Chip>
        {categories.map((c) => (
          <Chip key={c.id} href={catalogHref(f, { category: c.slug, brands: [] })} active={f.category === c.slug}>
            {c.name}
          </Chip>
        ))}
      </ul>

      <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
        <Filters f={f} brands={data.brands} />
        <section aria-label="Товары">
          <ActiveFilters f={f} />
          {data.products.length ? (
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
              {data.products.map((p) => (
                <li key={p.id} className="flex">
                  <ProductCard p={p} favored={favs.has(p.id)} inCart={cartIds.has(p.id)} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="font-semibold">Ничего не нашлось</p>
              <p className="mt-1 text-sm text-muted">Попробуйте убрать часть фильтров.</p>
              <Link href="/catalog" className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary-hover">
                Сбросить всё
              </Link>
            </div>
          )}
          <Pagination f={f} pages={data.pages} />
        </section>
      </div>
    </>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <li className="shrink-0">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`inline-flex h-9 items-center rounded-full border px-4 text-sm transition-colors ${
          active ? "border-primary bg-primary text-on-primary" : "border-border hover:border-primary"
        }`}
      >
        {children}
      </Link>
    </li>
  );
}

/**
 * Обычная GET-форма: работает даже без JavaScript, а результат — просто ссылка.
 * На десктопе фильтры всегда видны сбоку, на телефоне свёрнуты, чтобы не закрывать товары.
 */
function Filters({ f, brands }: { f: CatalogFilters; brands: { brand: string; n: number }[] }) {
  const activeCount = f.brands.length + (f.min ? 1 : 0) + (f.max ? 1 : 0) + (f.inStock ? 1 : 0);
  return (
    <>
      <aside className="hidden h-fit rounded-2xl border border-border bg-surface lg:sticky lg:top-24 lg:block" aria-label="Фильтры">
        <h2 className="border-b border-border p-4 font-semibold">Фильтры</h2>
        <FiltersForm id="filters" f={f} brands={brands} />
      </aside>
      <details className="group rounded-2xl border border-border bg-surface lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-semibold">
          <span>
            Фильтры{activeCount ? <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-on-primary">{activeCount}</span> : null}
          </span>
          <span aria-hidden className="text-muted transition-transform group-open:rotate-180">▾</span>
        </summary>
        <FiltersForm id="filters-mobile" f={f} brands={brands} />
      </details>
    </>
  );
}

function FiltersForm({ id, f, brands }: { id: string; f: CatalogFilters; brands: { brand: string; n: number }[] }) {
  return (
      <form id={id} action="/catalog" className="flex flex-col gap-5 border-t border-border p-4 lg:border-t-0">
        {f.q ? <input type="hidden" name="q" value={f.q} /> : null}
        {f.category ? <input type="hidden" name="category" value={f.category} /> : null}
        {f.sort !== "popular" ? <input type="hidden" name="sort" value={f.sort} /> : null}

        <fieldset>
          <legend className="text-sm font-semibold">Цена, ₽</legend>
          <div className="mt-2 flex items-center gap-2">
            <input name="min" inputMode="numeric" placeholder="от" defaultValue={f.min ?? ""} aria-label="Цена от"
              className="h-10 w-full min-w-0 rounded-xl border border-border bg-bg px-3 text-sm outline-none focus:border-primary" />
            <span className="text-muted">—</span>
            <input name="max" inputMode="numeric" placeholder="до" defaultValue={f.max ?? ""} aria-label="Цена до"
              className="h-10 w-full min-w-0 rounded-xl border border-border bg-bg px-3 text-sm outline-none focus:border-primary" />
          </div>
        </fieldset>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="stock" value="1" defaultChecked={f.inStock} className="size-4 accent-[var(--primary)]" />
          Только в наличии
        </label>

        {brands.length ? (
          <fieldset>
            <legend className="text-sm font-semibold">Бренд</legend>
            <div className="mt-2 flex max-h-64 flex-col gap-2 overflow-y-auto">
              {brands.map(({ brand, n }) => (
                <label key={brand} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="brand" value={brand} defaultChecked={f.brands.includes(brand)}
                    className="size-4 accent-[var(--primary)]" />
                  <span className="flex-1">{brand}</span>
                  <span className="text-xs text-muted">{n}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        <div className="flex gap-2">
          <button className="h-10 flex-1 rounded-xl bg-primary text-sm font-semibold text-on-primary hover:bg-primary-hover">
            Применить
          </button>
          <Link href={catalogHref({ ...f, brands: [], min: undefined, max: undefined, inStock: false })}
            className="grid h-10 place-items-center rounded-xl border border-border px-3 text-sm hover:bg-surface-2">
            Сброс
          </Link>
        </div>
      </form>
  );
}

function ActiveFilters({ f }: { f: CatalogFilters }) {
  const chips: { label: string; href: string }[] = [];
  if (f.q) chips.push({ label: `«${f.q}»`, href: catalogHref(f, { q: undefined }) });
  f.brands.forEach((b) => chips.push({ label: b, href: catalogHref(f, { brands: f.brands.filter((x) => x !== b) }) }));
  if (f.min) chips.push({ label: `от ${f.min.toLocaleString("ru-RU")} ₽`, href: catalogHref(f, { min: undefined }) });
  if (f.max) chips.push({ label: `до ${f.max.toLocaleString("ru-RU")} ₽`, href: catalogHref(f, { max: undefined }) });
  if (f.inStock) chips.push({ label: "в наличии", href: catalogHref(f, { inStock: false }) });
  if (!chips.length) return null;
  return (
    <ul className="mb-4 flex flex-wrap gap-2" aria-label="Активные фильтры">
      {chips.map((c) => (
        <li key={c.label}>
          <Link href={c.href} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-xs hover:bg-border"
            aria-label={`Убрать фильтр ${c.label}`}>
            {c.label} <span aria-hidden>×</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Pagination({ f, pages }: { f: CatalogFilters; pages: number }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Страницы" className="mt-8 flex flex-wrap justify-center gap-2">
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <Link key={n} href={catalogHref(f, { page: n })} aria-current={n === f.page ? "page" : undefined}
          className={`grid size-10 place-items-center rounded-xl border text-sm ${
            n === f.page ? "border-primary bg-primary text-on-primary" : "border-border hover:border-primary"
          }`}>
          {n}
        </Link>
      ))}
    </nav>
  );
}

function CatalogSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <div className="h-96 animate-pulse rounded-2xl bg-surface-2" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
