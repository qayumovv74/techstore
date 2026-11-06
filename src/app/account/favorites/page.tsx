import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { ProductCard } from "@/components/product-card";
import { getCartIds } from "@/lib/cart";
import { PanelSkeleton } from "../skeleton";

export const metadata: Metadata = { title: "Избранное" };

export default function FavoritesPage() {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <Favorites />
    </Suspense>
  );
}

async function Favorites() {
  const user = await requireUser("/account/favorites");
  const { products, stock, categories, productImages, favorites } = schema;
  const cartIds = await getCartIds();
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      brand: products.brand,
      price: products.price,
      specs: products.specs,
      available: sql<number>`coalesce(${stock.quantity} - ${stock.reserved}, 0)`,
      categorySlug: categories.slug,
      image: sql<string | null>`(select ${productImages.url} from ${productImages}
        where ${productImages.productId} = ${products.id} order by ${productImages.position} limit 1)`,
    })
    .from(favorites)
    .innerJoin(products, eq(products.id, favorites.productId))
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(stock, eq(stock.productId, products.id))
    .where(eq(favorites.userId, user.id))
    .orderBy(desc(favorites.createdAt));

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-ink/55 backdrop-blur-md p-10 text-center">
        <p className="font-semibold">В избранном пусто</p>
        <p className="mt-1 text-sm text-muted">Нажмите ♡ на карточке товара, чтобы сохранить его здесь.</p>
        <Link href="/catalog" className="mt-4 inline-block text-sm font-semibold text-lilac hover:text-white">В каталог →</Link>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
      {rows.map((p) => (
        <li key={p.id} className="flex">
          <ProductCard p={p} favored inCart={cartIds.has(p.id)} />
        </li>
      ))}
    </ul>
  );
}
