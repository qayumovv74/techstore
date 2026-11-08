"use server";

import { and, count, eq, like, notInArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireRole, STAFF_ROLES } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { saveProductImage, UploadError } from "@/lib/uploads";
import type { ActionState } from "@/lib/validation";

const rubles = z
  .string()
  .transform((v) => Number(v.replace(/[\s₽]/g, "").replace(",", ".")))
  .refine((n) => Number.isFinite(n) && n > 0 && n < 100_000_000, "Цена в рублях, больше нуля");

const productSchema = z.object({
  name: z.string().trim().min(2, "Название — минимум 2 символа").max(120),
  brand: z.string().trim().min(1, "Укажите бренд").max(40),
  categoryId: z.uuid("Выберите категорию"),
  price: rubles,
  description: z.string().trim().max(3000),
  quantity: z.coerce.number().int("Целое число").min(0, "Не меньше нуля").max(100_000),
  isActive: z.boolean(),
});

async function uniqueSlug(base: string) {
  const taken = await db
    .select({ slug: schema.products.slug })
    .from(schema.products)
    .where(or(eq(schema.products.slug, base), like(schema.products.slug, `${base}-%`)));
  const set = new Set(taken.map((t) => t.slug));
  if (!set.has(base)) return base;
  let i = 2;
  while (set.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

/** Новый товар: форма не уходит со страницы, а показывает, что добавили, и очищается */
export type ProductState = ActionState & { created?: { id: string; slug: string; name: string } };

export async function saveProduct(productId: string | null, _: ProductState, fd: FormData): Promise<ProductState> {
  await requireRole(["ADMIN"], "/admin/products");
  const raw = {
    name: String(fd.get("name") ?? ""),
    brand: String(fd.get("brand") ?? ""),
    categoryId: String(fd.get("categoryId") ?? ""),
    price: String(fd.get("price") ?? ""),
    description: String(fd.get("description") ?? ""),
    quantity: String(fd.get("quantity") ?? "0"),
  };
  const parsed = productSchema.safeParse({ ...raw, isActive: fd.get("isActive") === "on" });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values: raw };
  const d = parsed.data;

  // характеристики приходят парами specKey[] / specValue[]
  const keys = fd.getAll("specKey").map(String);
  const vals = fd.getAll("specValue").map(String);
  const specs: Record<string, string> = {};
  keys.forEach((k, i) => {
    const key = k.trim(), val = (vals[i] ?? "").trim();
    if (key && val) specs[key.slice(0, 40)] = val.slice(0, 120);
  });

  // новые фото сначала сохраняем на диск — если файл битый, в базу ничего не попадёт
  const files = fd.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > 10) return { error: "Не больше 10 фото за раз", values: raw };
  let uploaded: string[];
  try {
    uploaded = await Promise.all(files.map(saveProductImage));
  } catch (e) {
    if (e instanceof UploadError) return { error: e.message, values: raw };
    throw e;
  }
  const keep = fd.getAll("keepImage").map(String).filter((x) => z.uuid().safeParse(x).success);

  let slug: string | undefined; // для ссылки «Открыть на витрине» после создания
  const result = await db.transaction(async (tx) => {
    let id = productId;
    const values = {
      name: d.name,
      brand: d.brand,
      categoryId: d.categoryId,
      price: Math.round(d.price * 100),
      description: d.description,
      specs,
      isActive: d.isActive,
    };

    if (id) {
      const [row] = await tx.select().from(schema.stock).where(eq(schema.stock.productId, id)).for("update");
      if (row && d.quantity < row.reserved) {
        return { error: `На складе не может быть меньше, чем в резерве (${row.reserved} шт. ждут оплаты)` };
      }
      await tx.update(schema.products).set(values).where(eq(schema.products.id, id));
      await tx.update(schema.stock).set({ quantity: d.quantity }).where(eq(schema.stock.productId, id));
      // удалённые в форме фото
      await tx
        .delete(schema.productImages)
        .where(and(eq(schema.productImages.productId, id), keep.length ? notInArray(schema.productImages.id, keep) : undefined));
      // порядок оставшихся — как в форме
      for (const [position, imageId] of keep.entries()) {
        await tx.update(schema.productImages).set({ position })
          .where(and(eq(schema.productImages.id, imageId), eq(schema.productImages.productId, id)));
      }
    } else {
      const [created] = await tx
        .insert(schema.products)
        .values({ ...values, slug: await uniqueSlug(slugify(`${d.brand} ${d.name}`) || "tovar") })
        .returning({ id: schema.products.id, slug: schema.products.slug });
      id = created.id;
      slug = created.slug;
      await tx.insert(schema.stock).values({ productId: id, quantity: d.quantity });
    }

    if (uploaded.length) {
      await tx.insert(schema.productImages).values(
        uploaded.map((url, i) => ({ productId: id!, url, position: keep.length + i })),
      );
    }
    return { id };
  });

  if ("error" in result) return { error: result.error, values: raw };
  revalidatePath("/", "layout");
  if (!productId) {
    return {
      ok: true,
      message: `Товар «${d.name}» добавлен`,
      nonce: Date.now(),
      created: { id: result.id, slug: slug ?? "", name: d.name },
    };
  }
  return { ok: true, message: "Сохранено", nonce: Date.now() };
}

/** Быстрая правка остатка из таблицы — доступна и менеджеру */
export async function setStock(fd: FormData) {
  await requireRole(STAFF_ROLES, "/admin/products");
  const id = z.uuid().parse(fd.get("id"));
  const quantity = z.coerce.number().int().min(0).max(100_000).parse(fd.get("quantity"));
  await db.transaction(async (tx) => {
    const [row] = await tx.select().from(schema.stock).where(eq(schema.stock.productId, id)).for("update");
    if (!row) return;
    await tx.update(schema.stock).set({ quantity: Math.max(quantity, row.reserved) }).where(eq(schema.stock.productId, id));
  });
  revalidatePath("/admin/products");
}

export async function toggleActive(fd: FormData) {
  await requireRole(["ADMIN"], "/admin/products");
  const id = z.uuid().parse(fd.get("id"));
  const product = await db.query.products.findFirst({ where: eq(schema.products.id, id), columns: { isActive: true } });
  if (!product) return;
  await db.update(schema.products).set({ isActive: !product.isActive }).where(eq(schema.products.id, id));
  revalidatePath("/", "layout");
}

// ─── Категории ──────────────────────────────────────────────────
const categoryName = z.string().trim().min(2, "Минимум 2 символа").max(40);

export async function addCategory(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["ADMIN"], "/admin/categories");
  const parsed = categoryName.safeParse(String(fd.get("name") ?? ""));
  if (!parsed.success) return { fieldErrors: { name: parsed.error.issues.map((i) => i.message) } };
  const slug = await uniqueCategorySlug(slugify(parsed.data) || "category");
  await db.insert(schema.categories).values({ name: parsed.data, slug });
  revalidatePath("/", "layout");
  return { ok: true, message: "Категория добавлена", nonce: Date.now() };
}

async function uniqueCategorySlug(base: string) {
  const rows = await db.select({ slug: schema.categories.slug }).from(schema.categories).where(like(schema.categories.slug, `${base}%`));
  const set = new Set(rows.map((r) => r.slug));
  if (!set.has(base)) return base;
  let i = 2;
  while (set.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export async function renameCategory(fd: FormData) {
  await requireRole(["ADMIN"], "/admin/categories");
  const id = z.uuid().parse(fd.get("id"));
  const name = categoryName.parse(String(fd.get("name") ?? ""));
  await db.update(schema.categories).set({ name }).where(eq(schema.categories.id, id));
  revalidatePath("/", "layout");
}

export async function deleteCategory(fd: FormData) {
  await requireRole(["ADMIN"], "/admin/categories");
  const id = z.uuid().parse(fd.get("id"));
  const [{ n }] = await db.select({ n: count() }).from(schema.products).where(eq(schema.products.categoryId, id));
  if (n > 0) return; // сначала перенесите товары
  await db.delete(schema.categories).where(eq(schema.categories.id, id));
  revalidatePath("/", "layout");
}
