import "server-only";
import { and, avg, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { OrderStatus } from "@/db/schema";

/** Отзыв можно оставить, когда заказ оплачен (и дальше), кроме отменённых */
export const REVIEWABLE: OrderStatus[] = ["PAID", "ASSEMBLING", "SHIPPING", "DELIVERED"];

const firstImage = sql<string | null>`(
  select ${schema.productImages.url} from ${schema.productImages}
  where ${schema.productImages.productId} = ${schema.products.id}
  order by ${schema.productImages.position} limit 1
)`;

export type ReviewView = {
  id: string;
  rating: number;
  text: string;
  createdAt: Date;
  userId: string;
  userName: string;
  avatarUrl: string | null;
};

export async function getProductReviews(productId: string) {
  const [items, [stats]] = await Promise.all([
    db
      .select({
        id: schema.reviews.id,
        rating: schema.reviews.rating,
        text: schema.reviews.text,
        createdAt: schema.reviews.createdAt,
        userId: schema.reviews.userId,
        userName: schema.users.name,
        avatarUrl: schema.users.avatarUrl,
      })
      .from(schema.reviews)
      .innerJoin(schema.users, eq(schema.users.id, schema.reviews.userId))
      .where(and(eq(schema.reviews.productId, productId), eq(schema.reviews.hidden, false)))
      .orderBy(desc(schema.reviews.createdAt))
      .limit(50),
    db
      .select({ n: count(), avg: avg(schema.reviews.rating) })
      .from(schema.reviews)
      .where(and(eq(schema.reviews.productId, productId), eq(schema.reviews.hidden, false))),
  ]);
  return { items: items as ReviewView[], count: stats.n, avg: stats.avg ? Number(stats.avg) : 0 };
}

/** Заказ, подтверждающий покупку товара этим пользователем, или null */
export async function purchaseOf(userId: string, productId: string) {
  const [row] = await db
    .select({ orderId: schema.orders.id })
    .from(schema.orderItems)
    .innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId))
    .where(and(eq(schema.orders.userId, userId), eq(schema.orderItems.productId, productId), inArray(schema.orders.status, REVIEWABLE)))
    .orderBy(desc(schema.orders.createdAt))
    .limit(1);
  return row?.orderId ?? null;
}

export async function getMyReview(userId: string, productId: string) {
  return db.query.reviews.findFirst({
    where: and(eq(schema.reviews.userId, userId), eq(schema.reviews.productId, productId)),
    columns: { id: true, rating: true, text: true, hidden: true },
  });
}

/** Купленные товары, на которые покупатель ещё не написал отзыв */
export async function getPendingReviews(userId: string, limit = 6) {
  return db
    .selectDistinctOn([schema.products.id], {
      id: schema.products.id,
      slug: schema.products.slug,
      name: schema.products.name,
      image: firstImage,
    })
    .from(schema.orderItems)
    .innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId))
    .innerJoin(schema.products, eq(schema.products.id, schema.orderItems.productId))
    .leftJoin(schema.reviews, and(eq(schema.reviews.productId, schema.products.id), eq(schema.reviews.userId, userId)))
    .where(and(eq(schema.orders.userId, userId), inArray(schema.orders.status, REVIEWABLE), isNull(schema.reviews.id)))
    .limit(limit);
}

/** Последние хорошие отзывы для главной */
export async function getFeaturedReviews(limit = 8) {
  return db
    .select({
      id: schema.reviews.id,
      rating: schema.reviews.rating,
      text: schema.reviews.text,
      createdAt: schema.reviews.createdAt,
      userName: schema.users.name,
      avatarUrl: schema.users.avatarUrl,
      productName: schema.products.name,
      productSlug: schema.products.slug,
      productImage: firstImage,
    })
    .from(schema.reviews)
    .innerJoin(schema.users, eq(schema.users.id, schema.reviews.userId))
    .innerJoin(schema.products, eq(schema.products.id, schema.reviews.productId))
    .where(and(eq(schema.reviews.hidden, false), sql`${schema.reviews.rating} >= 4`))
    .orderBy(desc(schema.reviews.createdAt))
    .limit(limit);
}

export type FeaturedReview = Awaited<ReturnType<typeof getFeaturedReviews>>[number];
