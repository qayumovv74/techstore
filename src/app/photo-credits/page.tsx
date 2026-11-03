import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { asc, eq, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db";

export const metadata: Metadata = { title: "Авторы фотографий" };

export default function PhotoCreditsPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold">Авторы фотографий</h1>
      <p className="mt-3 text-sm text-muted">
        Фото товаров взяты с Wikimedia Commons и распространяются по свободным лицензиям. Снимки приведены к квадратному формату: обрезаны или вписаны на размытый фон того же кадра.
      </p>
      <Suspense fallback={<div className="mt-6 h-64 animate-pulse rounded-2xl bg-surface-2" />}>
        <Credits />
      </Suspense>
    </main>
  );
}

async function Credits() {
  const rows = await db
    .select({
      product: schema.products.name,
      brand: schema.products.brand,
      slug: schema.products.slug,
      author: schema.productImages.author,
      license: schema.productImages.license,
      licenseUrl: schema.productImages.licenseUrl,
      sourceUrl: schema.productImages.sourceUrl,
    })
    .from(schema.productImages)
    .innerJoin(schema.products, eq(schema.products.id, schema.productImages.productId))
    .where(isNotNull(schema.productImages.author))
    .orderBy(asc(schema.products.brand), asc(schema.products.name), asc(schema.productImages.position));

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b border-border text-xs text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Товар</th>
            <th className="px-4 py-3 font-medium">Автор</th>
            <th className="px-4 py-3 font-medium">Лицензия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="px-4 py-2.5">
                <Link href={`/product/${r.slug}`} className="hover:text-primary">{r.brand} {r.product}</Link>
              </td>
              <td className="px-4 py-2.5">
                {r.sourceUrl ? <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="underline hover:text-primary">{r.author}</a> : r.author}
              </td>
              <td className="px-4 py-2.5">
                {r.licenseUrl ? <a href={r.licenseUrl} target="_blank" rel="noreferrer" className="underline hover:text-primary">{r.license}</a> : r.license}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
