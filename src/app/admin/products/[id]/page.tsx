import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Товар" };

export default function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface-2" />}>
      <EditProduct {...props} />
    </Suspense>
  );
}

async function EditProduct({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  await requireRole(["ADMIN"], "/admin/products");
  const { id } = await params;
  const { created } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [product, categories] = await Promise.all([
    db.query.products.findFirst({
      where: eq(schema.products.id, id),
      with: { stock: true, images: { orderBy: asc(schema.productImages.position) } },
    }),
    db.select({ id: schema.categories.id, name: schema.categories.name }).from(schema.categories).orderBy(asc(schema.categories.name)),
  ]);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/products" className="text-sm text-lilac hover:text-white">← Все товары</Link>
        <Link href={`/product/${product.slug}`} className="text-sm text-muted hover:text-primary">Открыть на сайте ↗</Link>
      </div>
      <h2 className="text-xl font-bold">{product.brand} {product.name}</h2>
      {created ? <p className="rounded-2xl bg-primary/10 p-3 text-sm text-primary">Товар создан</p> : null}
      <ProductForm
        categories={categories}
        initial={{
          id: product.id,
          name: product.name,
          brand: product.brand,
          categoryId: product.categoryId,
          price: String(product.price / 100),
          description: product.description,
          quantity: product.stock?.quantity ?? 0,
          reserved: product.stock?.reserved ?? 0,
          isActive: product.isActive,
          specs: Object.entries(product.specs),
          images: product.images.map((i) => ({ id: i.id, url: i.url })),
        }}
      />
    </div>
  );
}
