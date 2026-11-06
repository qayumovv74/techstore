import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { and, asc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireRole, STAFF_ROLES } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { ProductArt } from "@/components/product-art";
import { setStock, toggleActive } from "./actions";
import { Button } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button-variants";

export const metadata: Metadata = { title: "Товары" };

export default function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface-2" />}>
      <Products searchParams={searchParams} />
    </Suspense>
  );
}

async function Products({ searchParams }: { searchParams: PageProps<"/admin/products">["searchParams"] }) {
  const me = await requireRole(STAFF_ROLES, "/admin/products");
  const isAdmin = me.role === "ADMIN";
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const category = typeof sp.category === "string" ? sp.category : "";
  const low = sp.stock === "low";
  const { products, stock, categories, productImages } = schema;
  const available = sql<number>`(${stock.quantity} - ${stock.reserved})::int`;

  const where: SQL[] = [];
  if (q) where.push(or(ilike(products.name, `%${q}%`), ilike(products.brand, `%${q}%`))!);
  if (category) where.push(eq(categories.slug, category));
  if (low) where.push(sql`${stock.quantity} - ${stock.reserved} <= 3`);

  const [rows, cats] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        brand: products.brand,
        slug: products.slug,
        price: products.price,
        isActive: products.isActive,
        category: categories.name,
        categorySlug: categories.slug,
        quantity: stock.quantity,
        reserved: stock.reserved,
        available,
        image: sql<string | null>`(select ${productImages.url} from ${productImages}
          where ${productImages.productId} = ${products.id} order by ${productImages.position} limit 1)`,
      })
      .from(products)
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(stock, eq(stock.productId, products.id))
      .where(where.length ? and(...where) : undefined)
      .orderBy(low ? asc(available) : asc(products.name)),
    db.select().from(categories).orderBy(asc(categories.name)),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <form className="flex flex-1 flex-wrap gap-2">
          <input name="q" defaultValue={q} placeholder="Название или бренд" aria-label="Поиск товара"
            className="h-10 min-w-48 flex-1 rounded-xl border border-border bg-surface px-3 text-sm" />
          <select name="category" defaultValue={category} aria-label="Категория" className="h-10 rounded-xl border border-border bg-surface px-3 text-sm">
            <option value="">Все категории</option>
            {cats.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <label className="flex items-center gap-2 px-2 text-sm">
            <input type="checkbox" name="stock" value="low" defaultChecked={low} className="size-4 accent-[var(--primary)]" /> ≤ 3 шт.
          </label>
          <Button variant="outline" className="h-10 font-normal">Показать</Button>
        </form>
        {isAdmin ? (
          <div className="flex gap-2">
            <Link href="/admin/categories" className={buttonVariants({ variant: "outline", className: "h-10" })}>Категории</Link>
            <Link href="/admin/products/new" className={buttonVariants({ className: "h-10 font-semibold" })}>+ Товар</Link>
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-border text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Товар</th>
              <th className="px-4 py-3 font-medium">Категория</th>
              <th className="px-4 py-3 font-medium">Цена</th>
              <th className="px-4 py-3 font-medium">Склад / резерв</th>
              <th className="px-4 py-3 font-medium">На витрине</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((p) => (
              <tr key={p.id} className={p.isActive ? "" : "opacity-60"}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
                      {p.image ? <Image src={p.image} alt="" fill sizes="44px" className="object-cover" /> : <ProductArt category={p.categorySlug} brand="" className="size-full" />}
                    </div>
                    <div className="min-w-0">
                      {isAdmin ? (
                        <Link href={`/admin/products/${p.id}`} className="font-semibold hover:text-primary">{p.brand} {p.name}</Link>
                      ) : (
                        <span className="font-semibold">{p.brand} {p.name}</span>
                      )}
                      <Link href={`/product/${p.slug}`} className="block text-xs text-muted hover:text-primary">на сайте ↗</Link>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-muted">{p.category}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{formatPrice(p.price)}</td>
                <td className="px-4 py-2.5">
                  <form action={setStock} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <input name="quantity" type="number" min={p.reserved ?? 0} defaultValue={p.quantity ?? 0} aria-label={`Остаток ${p.name}`}
                      className={`h-9 w-20 rounded-lg border bg-bg px-2 text-sm ${Number(p.available) <= 3 ? "border-danger" : "border-border"}`} />
                    <Button variant="outline" size="sm" className="h-9 px-2.5">OK</Button>
                    {p.reserved ? <span className="text-xs text-muted">резерв {p.reserved}</span> : null}
                  </form>
                </td>
                <td className="px-4 py-2.5">
                  {isAdmin ? (
                    <form action={toggleActive}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className={`rounded-full px-3 py-1 text-xs font-semibold ${p.isActive ? "bg-primary/15 text-primary" : "bg-surface-2 text-muted"}`}>
                        {p.isActive ? "да" : "скрыт"}
                      </button>
                    </form>
                  ) : p.isActive ? "да" : "скрыт"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">Найдено: {rows.length}. Менеджер может менять только остатки, товары и категории — админ.</p>
    </div>
  );
}
