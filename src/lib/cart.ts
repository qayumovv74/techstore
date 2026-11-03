import "server-only";
import { cookies } from "next/headers";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "./auth";

// Гость: корзина в cookie {productId: qty}. После входа переезжает в таблицу cart_items.
const CART_COOKIE = "ts_cart";
export const MAX_QTY = 10;

type Lines = Record<string, number>;

async function readGuestCart(): Promise<Lines> {
  try {
    const raw = (await cookies()).get(CART_COOKIE)?.value;
    const parsed = raw ? JSON.parse(raw) : {};
    const lines: Lines = {};
    for (const [id, qty] of Object.entries(parsed)) {
      if (/^[0-9a-f-]{36}$/i.test(id) && Number.isInteger(qty) && (qty as number) > 0) lines[id] = Math.min(qty as number, MAX_QTY);
    }
    return lines;
  } catch {
    return {};
  }
}

async function writeGuestCart(lines: Lines) {
  const jar = await cookies();
  if (!Object.keys(lines).length) jar.delete(CART_COOKIE);
  else jar.set(CART_COOKIE, JSON.stringify(lines), { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax", httpOnly: true });
}

async function readLines(): Promise<Lines> {
  const user = await getCurrentUser();
  if (!user) return readGuestCart();
  const rows = await db
    .select({ id: schema.cartItems.productId, qty: schema.cartItems.qty })
    .from(schema.cartItems)
    .where(eq(schema.cartItems.userId, user.id));
  return Object.fromEntries(rows.map((r) => [r.id, r.qty]));
}

export async function setLine(productId: string, qty: number) {
  qty = Math.max(0, Math.min(Math.floor(qty), MAX_QTY));
  const user = await getCurrentUser();

  if (!user) {
    const lines = await readGuestCart();
    if (qty === 0) delete lines[productId];
    else lines[productId] = qty;
    await writeGuestCart(lines);
    return;
  }

  const where = and(eq(schema.cartItems.userId, user.id), eq(schema.cartItems.productId, productId));
  if (qty === 0) {
    await db.delete(schema.cartItems).where(where);
    return;
  }
  await db
    .insert(schema.cartItems)
    .values({ userId: user.id, productId, qty })
    .onConflictDoUpdate({ target: [schema.cartItems.userId, schema.cartItems.productId], set: { qty } });
}

export async function getCartLineQty(productId: string) {
  return (await readLines())[productId] ?? 0;
}

export async function getCartCount() {
  return Object.values(await readLines()).reduce((a, b) => a + b, 0);
}

export async function getCartIds() {
  return new Set(Object.keys(await readLines()));
}

/** Корзина с актуальными ценами и остатками. Снятые с продажи товары молча убираем. */
export async function getCart() {
  const lines = await readLines();
  const ids = Object.keys(lines);
  if (!ids.length) return { items: [], count: 0, total: 0 };

  const { products, stock, categories, productImages } = schema;
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      brand: products.brand,
      price: products.price,
      categorySlug: categories.slug,
      available: sql<number>`coalesce(${stock.quantity} - ${stock.reserved}, 0)`,
      image: sql<string | null>`(select ${productImages.url} from ${productImages}
        where ${productImages.productId} = ${products.id} order by ${productImages.position} limit 1)`,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(stock, eq(stock.productId, products.id))
    .where(and(inArray(products.id, ids), eq(products.isActive, true)));

  const items = rows
    .map((p) => ({ ...p, available: Number(p.available), qty: lines[p.id] }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    total: items.reduce((s, i) => s + i.price * i.qty, 0),
  };
}

/** Вызывается после входа: переносим гостевую корзину в аккаунт */
export async function mergeGuestCart(userId: string) {
  const guest = await readGuestCart();
  const ids = Object.keys(guest);
  if (!ids.length) return;
  const existing = await db
    .select({ id: schema.products.id })
    .from(schema.products)
    .where(inArray(schema.products.id, ids));
  for (const { id } of existing) {
    await db
      .insert(schema.cartItems)
      .values({ userId, productId: id, qty: guest[id] })
      .onConflictDoUpdate({
        target: [schema.cartItems.userId, schema.cartItems.productId],
        set: { qty: sql`least(${schema.cartItems.qty} + ${guest[id]}, ${MAX_QTY})` },
      });
  }
  await writeGuestCart({});
}
