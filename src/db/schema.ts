import {
  pgTable,
  pgEnum,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uuid,
  uniqueIndex,
  index,
  primaryKey,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Перечисления ────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["CUSTOMER", "MANAGER", "ADMIN"]);

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING_PAYMENT", // ожидает оплаты
  "PAID", // оплачен
  "ASSEMBLING", // собирается
  "SHIPPING", // в доставке
  "DELIVERED", // доставлен
  "CANCELLED", // отменён
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
]);

export const paymentProviderEnum = pgEnum("payment_provider", ["MOCK", "YOOKASSA", "SBP"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// ─── Пользователи ────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: roleEnum("role").notNull().default("CUSTOMER"),
  ...timestamps,
});

export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** Подпись для выбора: «Дом», «Работа» */
  label: text("label").notNull().default("Дом"),
  city: text("city").notNull(),
  street: text("street").notNull(),
  apartment: text("apartment"),
  comment: text("comment"),
  isDefault: boolean("is_default").notNull().default(false),
  ...timestamps,
});

// ─── Каталог ─────────────────────────────────────────────────────
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, {
    onDelete: "set null",
  }),
  ...timestamps,
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    brand: text("brand").notNull(),
    description: text("description").notNull().default(""),
    /** Цена в копейках, целым числом — без ошибок округления (12999000 = 129 990 ₽) */
    price: integer("price").notNull(),
    /** Характеристики различаются по типу техники, поэтому JSON */
    specs: jsonb("specs").$type<Record<string, string>>().notNull().default({}),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("products_category_idx").on(t.categoryId), index("products_brand_idx").on(t.brand)],
);

export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  position: integer("position").notNull().default(0),
});

export const stock = pgTable("stock", {
  productId: uuid("product_id")
    .primaryKey()
    .references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(0),
  /** Зарезервировано под неоплаченные заказы (15 минут) */
  reserved: integer("reserved").notNull().default(0),
  updatedAt: timestamps.updatedAt,
});

// ─── Избранное ───────────────────────────────────────────────────
export const favorites = pgTable(
  "favorites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamps.createdAt,
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

// ─── Корзина и заказы ────────────────────────────────────────────
export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    qty: integer("qty").notNull().default(1),
    ...timestamps,
  },
  (t) => [uniqueIndex("cart_user_product_uq").on(t.userId, t.productId)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Человекочитаемый номер: TS-000123 */
    number: integer("number").generatedAlwaysAsIdentity({ startWith: 1000 }).notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: orderStatusEnum("status").notNull().default("PENDING_PAYMENT"),
    total: integer("total").notNull(),
    /** Копия адреса на момент заказа */
    addressSnapshot: jsonb("address_snapshot")
      .$type<{ city: string; street: string; comment?: string; phone: string }>()
      .notNull(),
    reservedUntil: timestamp("reserved_until", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("orders_user_idx").on(t.userId), index("orders_status_idx").on(t.status)],
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  /** Название и цена фиксируются на момент покупки */
  nameAtPurchase: text("name_at_purchase").notNull(),
  priceAtPurchase: integer("price_at_purchase").notNull(),
  qty: integer("qty").notNull(),
});

/** Суммы во всех таблицах — в копейках */
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: "cascade" }),
  provider: paymentProviderEnum("provider").notNull().default("MOCK"),
  externalId: text("external_id").unique(),
  amount: integer("amount").notNull(),
  status: paymentStatusEnum("status").notNull().default("PENDING"),
  ...timestamps,
});

/** История смены статусов — таймлайн для клиента и аудит для админа */
export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: orderStatusEnum("from_status"),
    toStatus: orderStatusEnum("to_status").notNull(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("order_events_order_idx").on(t.orderId)],
);

// ─── Связи (для удобных запросов db.query.*) ─────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  cartItems: many(cartItems),
  favorites: many(favorites),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  product: one(products, { fields: [favorites.productId], references: [products.id] }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, { fields: [addresses.userId], references: [users.id] }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "tree",
  }),
  children: many(categories, { relationName: "tree" }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  images: many(productImages),
  stock: one(stock, { fields: [products.id], references: [stock.productId] }),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const stockRelations = relations(stock, ({ one }) => ({
  product: one(products, { fields: [stock.productId], references: [products.id] }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, { fields: [cartItems.userId], references: [users.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
  payment: one(payments, { fields: [orders.id], references: [payments.orderId] }),
  events: many(orderEvents),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, { fields: [orderEvents.orderId], references: [orders.id] }),
  actor: one(users, { fields: [orderEvents.actorId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type Address = typeof addresses.$inferSelect;
export type Role = (typeof roleEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
