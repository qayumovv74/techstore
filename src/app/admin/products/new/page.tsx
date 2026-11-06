import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Новый товар" };

export default function NewProductPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface-2" />}>
      <NewProduct />
    </Suspense>
  );
}

async function NewProduct() {
  await requireRole(["ADMIN"], "/admin/products/new");
  const categories = await db.select({ id: schema.categories.id, name: schema.categories.name }).from(schema.categories).orderBy(asc(schema.categories.name));
  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/products" className="text-sm text-lilac hover:text-white">← Все товары</Link>
      <h2 className="text-xl font-bold">Новый товар</h2>
      <ProductForm
        categories={categories}
        initial={{ id: null, name: "", brand: "", categoryId: "", price: "", description: "", quantity: 0, reserved: 0, isActive: true, specs: [], images: [] }}
      />
    </div>
  );
}
