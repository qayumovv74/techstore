import { Suspense } from "react";
import { connection } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { formatPrice } from "@/lib/format";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <section className="overflow-hidden rounded-3xl bg-ink p-8 text-white sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-sky">Новинки осени</p>
        <h1 className="mt-3 max-w-xl text-3xl font-bold leading-tight sm:text-5xl">
          Техника, которая <span className="text-aqua">работает на вас</span>
        </h1>
        <p className="mt-4 max-w-lg text-sky">
          Официальная гарантия, доставка по Москве за 1 день и статус заказа в реальном времени.
        </p>
      </section>

      <Suspense fallback={<GridSkeleton />}>
        <Catalog />
      </Suspense>
    </main>
  );
}

async function Catalog() {
  await connection(); // каталог читаем из БД на каждый запрос (кэш добавим на этапе 2)
  const categories = await db.query.categories.findMany({
    orderBy: asc(schema.categories.name),
    with: {
      products: {
        where: eq(schema.products.isActive, true),
        limit: 4,
        orderBy: asc(schema.products.price),
        with: { stock: true },
      },
    },
  });

  return (
    <div className="mt-12 flex flex-col gap-12">
      {categories.map((cat) => (
        <section key={cat.id}>
          <h2 className="text-xl font-bold">{cat.name}</h2>
          <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {cat.products.map((p) => {
              const left = (p.stock?.quantity ?? 0) - (p.stock?.reserved ?? 0);
              return (
                <li key={p.id} className="flex flex-col rounded-2xl border border-border bg-surface p-4">
                  <div aria-hidden className="grid aspect-square place-items-center rounded-xl bg-surface-2 text-3xl font-bold text-slate/40">
                    {p.brand.slice(0, 1)}
                  </div>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted">{p.brand}</p>
                  <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold">{p.name}</h3>
                  <p className="mt-auto pt-3 font-bold">{formatPrice(p.price)}</p>
                  <p className={`text-xs ${left > 0 ? "text-primary" : "text-danger"}`}>
                    {left > 0 ? `В наличии: ${left} шт.` : "Нет в наличии"}
                  </p>
                </li>
              );
            })}
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
