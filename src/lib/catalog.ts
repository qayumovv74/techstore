/**
 * Чтение каталога. Все фильтры живут в URL (?q=&category=&brand=…),
 * поэтому ссылкой на подборку можно поделиться, а кнопка «Назад» работает.
 */
import "server-only";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";

const { products, stock, categories, productImages } = schema;

export const PAGE_SIZE = 12;

export const SORTS = {
  popular: "Сначала популярные",
  price_asc: "Сначала дешевле",
  price_desc: "Сначала дороже",
  name: "По названию",
} as const;
export type Sort = keyof typeof SORTS;

export type CatalogFilters = {
  q?: string;
  category?: string;
  brands: string[];
  min?: number; // рубли
  max?: number; // рубли
  inStock: boolean;
  sort: Sort;
  page: number;
};

type Raw = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
const many = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []).filter(Boolean);
const num = (v: string | undefined) => {
  const n = Number(v?.replace(/\s/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
};

/** URL → проверенные фильтры. Мусор в адресе просто игнорируется. */
export function parseFilters(sp: Raw): CatalogFilters {
  const sort = one(sp.sort);
  return {
    q: one(sp.q)?.slice(0, 80),
    category: one(sp.category),
    brands: many(sp.brand).slice(0, 20),
    min: num(one(sp.min)),
    max: num(one(sp.max)),
    inStock: one(sp.stock) === "1",
    sort: sort && sort in SORTS ? (sort as Sort) : "popular",
    page: Math.min(num(one(sp.page)) ?? 1, 1000),
  };
}

const available = sql<number>`coalesce(${stock.quantity} - ${stock.reserved}, 0)`;

/** Экранируем % и _ — иначе поиск «100%» сломал бы ILIKE */
const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

function whereClause(f: CatalogFilters, categoryId?: string, opts: { skipBrand?: boolean } = {}) {
  const conds: SQL[] = [eq(products.isActive, true)];
  if (categoryId) conds.push(eq(products.categoryId, categoryId));
  if (f.q) {
    const p = likePattern(f.q);
    conds.push(or(ilike(products.name, p), ilike(products.brand, p))!);
  }
  if (!opts.skipBrand && f.brands.length) conds.push(inArray(products.brand, f.brands));
  if (f.min) conds.push(gte(products.price, f.min * 100));
  if (f.max) conds.push(lte(products.price, f.max * 100));
  if (f.inStock) conds.push(sql`${available} > 0`);
  return and(...conds);
}

export async function getCategories() {
  return db.query.categories.findMany({ orderBy: asc(categories.name) });
}

export async function getCatalog(f: CatalogFilters) {
  const category = f.category
    ? await db.query.categories.findFirst({ where: eq(categories.slug, f.category) })
    : undefined;
  const where = whereClause(f, category?.id);

  const order = {
    popular: [desc(sql`${available} > 0`), desc(products.createdAt), asc(products.name)],
    price_asc: [asc(products.price)],
    price_desc: [desc(products.price)],
    name: [asc(products.name)],
  }[f.sort];

  const [rows, [{ total }], brandRows] = await Promise.all([
    db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        brand: products.brand,
        price: products.price,
        specs: products.specs,
        available,
        categorySlug: categories.slug,
        image: sql<string | null>`(select ${productImages.url} from ${productImages}
          where ${productImages.productId} = ${products.id} order by ${productImages.position} limit 1)`,
      })
      .from(products)
      .leftJoin(stock, eq(stock.productId, products.id))
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(where)
      .orderBy(...order)
      .limit(PAGE_SIZE)
      .offset((f.page - 1) * PAGE_SIZE),
    db
      .select({ total: count() })
      .from(products)
      .leftJoin(stock, eq(stock.productId, products.id))
      .where(where),
    // Бренды считаем без фильтра по бренду — иначе выбрав один, остальные пропадут
    db
      .select({ brand: products.brand, n: count() })
      .from(products)
      .leftJoin(stock, eq(stock.productId, products.id))
      .where(whereClause(f, category?.id, { skipBrand: true }))
      .groupBy(products.brand)
      .orderBy(asc(products.brand)),
  ]);

  return {
    category: category ?? null,
    products: rows,
    total,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    brands: brandRows,
  };
}

export type CatalogItem = Awaited<ReturnType<typeof getCatalog>>["products"][number];

export async function getProduct(slug: string) {
  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.isActive, true)),
    with: {
      category: true,
      stock: true,
      images: { orderBy: asc(productImages.position) },
    },
  });
  if (!product) return null;
  return {
    ...product,
    available: Math.max(0, (product.stock?.quantity ?? 0) - (product.stock?.reserved ?? 0)),
  };
}

export async function getSimilar(productId: string, categoryId: string, price: number) {
  return db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      brand: products.brand,
      price: products.price,
      specs: products.specs,
      available,
      categorySlug: categories.slug,
      image: sql<string | null>`(select ${productImages.url} from ${productImages}
        where ${productImages.productId} = ${products.id} order by ${productImages.position} limit 1)`,
    })
    .from(products)
    .leftJoin(stock, eq(stock.productId, products.id))
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(eq(products.categoryId, categoryId), ne(products.id, productId), eq(products.isActive, true)))
    // ближайшие по цене
    .orderBy(sql`abs(${products.price} - ${price})`)
    .limit(4);
}
