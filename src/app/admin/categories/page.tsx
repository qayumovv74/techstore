import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { asc, count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth";
import { deleteCategory, renameCategory } from "../products/actions";
import { AddCategoryForm } from "./add-form";

export const metadata: Metadata = { title: "Категории" };

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface-2" />}>
      <Categories />
    </Suspense>
  );
}

async function Categories() {
  await requireRole(["ADMIN"], "/admin/categories");
  const rows = await db
    .select({ id: schema.categories.id, name: schema.categories.name, slug: schema.categories.slug, products: count(schema.products.id) })
    .from(schema.categories)
    .leftJoin(schema.products, eq(schema.products.categoryId, schema.categories.id))
    .groupBy(schema.categories.id)
    .orderBy(asc(schema.categories.name));

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/products" className="text-sm text-primary hover:text-primary-hover">← Товары</Link>
      <h2 className="text-xl font-bold">Категории</h2>
      <AddCategoryForm />
      <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
        {rows.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <form action={renameCategory} className="flex flex-1 items-center gap-2">
              <input type="hidden" name="id" value={c.id} />
              <input name="name" defaultValue={c.name} aria-label={`Название категории ${c.name}`}
                className="h-9 w-64 rounded-lg border border-border bg-bg px-2 text-sm" />
              <button className="h-9 rounded-lg border border-border px-3 text-xs hover:bg-surface-2">Переименовать</button>
            </form>
            <Link href={`/admin/products?category=${c.slug}`} className="text-sm text-muted hover:text-primary">{c.products} тов.</Link>
            {c.products === 0 ? (
              <form action={deleteCategory}>
                <input type="hidden" name="id" value={c.id} />
                <button className="text-sm text-danger hover:underline">Удалить</button>
              </form>
            ) : (
              <span className="text-xs text-muted" title="Сначала перенесите товары в другую категорию">нельзя удалить</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
