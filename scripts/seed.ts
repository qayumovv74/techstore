/**
 * Демо-данные: категории, ~50 товаров с остатками, три пользователя.
 * Запуск: npm run db:seed
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import * as schema from "../src/db/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

type Seed = { brand: string; name: string; price: number; specs: Record<string, string> };

// Цены в копейках: 129_990_00 = 129 990 ₽
const catalog: Record<string, { name: string; items: Seed[] }> = {
  smartphones: {
    name: "Смартфоны",
    items: [
      { brand: "Apple", name: "iPhone 17 Pro 256GB", price: 129_990_00, specs: { Экран: "6.3\" OLED 120 Гц", Память: "256 ГБ", Камера: "48 Мп ×3" } },
      { brand: "Apple", name: "iPhone 17 128GB", price: 87_990_00, specs: { Экран: "6.3\" OLED", Память: "128 ГБ", Камера: "48 Мп ×2" } },
      { brand: "Apple", name: "iPhone 16e 128GB", price: 60_990_00, specs: { Экран: "6.1\" OLED", Память: "128 ГБ", Камера: "48 Мп" } },
      { brand: "Samsung", name: "Galaxy S25 Ultra 512GB", price: 134_990_00, specs: { Экран: "6.9\" AMOLED", Память: "512 ГБ", Камера: "200 Мп" } },
      { brand: "Samsung", name: "Galaxy S25 256GB", price: 77_990_00, specs: { Экран: "6.2\" AMOLED", Память: "256 ГБ", Камера: "50 Мп" } },
      { brand: "Samsung", name: "Galaxy A56 128GB", price: 35_990_00, specs: { Экран: "6.7\" AMOLED", Память: "128 ГБ", Камера: "50 Мп" } },
      { brand: "Xiaomi", name: "Xiaomi 15 256GB", price: 71_990_00, specs: { Экран: "6.36\" AMOLED", Память: "256 ГБ", Камера: "50 Мп Leica" } },
      { brand: "Xiaomi", name: "Redmi Note 14 Pro 256GB", price: 29_990_00, specs: { Экран: "6.67\" AMOLED", Память: "256 ГБ", Камера: "200 Мп" } },
      { brand: "Google", name: "Pixel 9 128GB", price: 69_990_00, specs: { Экран: "6.3\" OLED", Память: "128 ГБ", Камера: "50 Мп" } },
      { brand: "Honor", name: "Honor 400 256GB", price: 42_990_00, specs: { Экран: "6.55\" AMOLED", Память: "256 ГБ", Камера: "200 Мп" } },
    ],
  },
  laptops: {
    name: "Ноутбуки",
    items: [
      { brand: "Apple", name: "MacBook Air 13 M4 16/256", price: 108_990_00, specs: { Процессор: "Apple M4", ОЗУ: "16 ГБ", SSD: "256 ГБ" } },
      { brand: "Apple", name: "MacBook Pro 14 M4 Pro 24/512", price: 206_990_00, specs: { Процессор: "M4 Pro", ОЗУ: "24 ГБ", SSD: "512 ГБ" } },
      { brand: "Lenovo", name: "ThinkPad X1 Carbon Gen 13", price: 171_990_00, specs: { Процессор: "Core Ultra 7", ОЗУ: "32 ГБ", SSD: "1 ТБ" } },
      { brand: "Lenovo", name: "IdeaPad Flex 14", price: 64_990_00, specs: { Процессор: "Ryzen 7", ОЗУ: "16 ГБ", SSD: "512 ГБ" } },
      { brand: "ASUS", name: "ROG Zephyrus G14", price: 189_990_00, specs: { Процессор: "Ryzen AI 9", ОЗУ: "32 ГБ", Видео: "RTX 5070 Ti" } },
      { brand: "ASUS", name: "Zenbook 14 OLED", price: 86_990_00, specs: { Процессор: "Core Ultra 5", ОЗУ: "16 ГБ", SSD: "1 ТБ" } },
      { brand: "HP", name: "Victus 15 RTX 4050", price: 73_990_00, specs: { Процессор: "Core i5", ОЗУ: "16 ГБ", Видео: "RTX 4050" } },
      { brand: "Acer", name: "Aspire 5 15", price: 44_990_00, specs: { Процессор: "Core i5", ОЗУ: "8 ГБ", SSD: "512 ГБ" } },
      { brand: "Dell", name: "XPS 13", price: 144_990_00, specs: { Процессор: "Snapdragon X Elite", ОЗУ: "16 ГБ", SSD: "512 ГБ" } },
      { brand: "MSI", name: "Thin GF63", price: 74_990_00, specs: { Процессор: "Core i7", ОЗУ: "16 ГБ", Видео: "RTX 4060" } },
    ],
  },
  audio: {
    name: "Аудио",
    items: [
      { brand: "Apple", name: "AirPods Pro 3", price: 25_990_00, specs: { Тип: "TWS", Шумоподавление: "Да", Автономность: "8 ч" } },
      { brand: "Apple", name: "AirPods 4", price: 14_990_00, specs: { Тип: "TWS", Шумоподавление: "Нет", Автономность: "5 ч" } },
      { brand: "Sony", name: "WH-1000XM6", price: 39_990_00, specs: { Тип: "Накладные", Шумоподавление: "Да", Автономность: "30 ч" } },
      { brand: "Sony", name: "WF-1000XM4", price: 18_990_00, specs: { Тип: "TWS", Шумоподавление: "Да", Автономность: "8 ч" } },
      { brand: "Samsung", name: "Galaxy Buds3 Pro", price: 20_990_00, specs: { Тип: "TWS", Шумоподавление: "Да", Автономность: "6 ч" } },
      { brand: "JBL", name: "Charge 6", price: 15_990_00, specs: { Тип: "Колонка", Защита: "IP68", Автономность: "24 ч" } },
      { brand: "JBL", name: "Flip 7", price: 11_990_00, specs: { Тип: "Колонка", Защита: "IP68", Автономность: "14 ч" } },
      { brand: "Marshall", name: "Major V", price: 14_990_00, specs: { Тип: "Накладные", Шумоподавление: "Нет", Автономность: "100 ч" } },
      { brand: "Xiaomi", name: "Redmi Buds 6 Pro", price: 4_990_00, specs: { Тип: "TWS", Шумоподавление: "Да", Автономность: "9.5 ч" } },
      { brand: "Bose", name: "QuietComfort Ultra Earbuds", price: 29_990_00, specs: { Тип: "TWS", Шумоподавление: "Да", Автономность: "6 ч" } },
    ],
  },
  tablets: {
    name: "Планшеты",
    items: [
      { brand: "Apple", name: "iPad Air 11 M3 128GB", price: 67_990_00, specs: { Экран: "11\" Liquid Retina", Память: "128 ГБ", Чип: "M3" } },
      { brand: "Apple", name: "iPad 11 128GB", price: 38_990_00, specs: { Экран: "11\"", Память: "128 ГБ", Чип: "A16" } },
      { brand: "Apple", name: "iPad Pro 13 M4 256GB", price: 140_990_00, specs: { Экран: "13\" OLED", Память: "256 ГБ", Чип: "M4" } },
      { brand: "Samsung", name: "Galaxy Tab S10 FE", price: 47_990_00, specs: { Экран: "10.9\"", Память: "128 ГБ", Стилус: "S Pen" } },
      { brand: "Samsung", name: "Galaxy Tab S9", price: 59_990_00, specs: { Экран: "11\" AMOLED", Память: "128 ГБ", Стилус: "S Pen" } },
      { brand: "Xiaomi", name: "Xiaomi Pad 7", price: 32_990_00, specs: { Экран: "11.2\" 144 Гц", Память: "128 ГБ", Чип: "Snapdragon 7+" } },
      { brand: "Lenovo", name: "Tab M8 FHD", price: 11_990_00, specs: { Экран: "8\" IPS", Память: "32 ГБ", Стилус: "Нет" } },
      { brand: "Honor", name: "Pad 9", price: 24_990_00, specs: { Экран: "12.1\"", Память: "256 ГБ", Чип: "Snapdragon 6" } },
    ],
  },
  wearables: {
    name: "Часы и гаджеты",
    items: [
      { brand: "Apple", name: "Apple Watch Series 11 46mm", price: 41_990_00, specs: { Корпус: "Алюминий", GPS: "Да", Автономность: "24 ч" } },
      { brand: "Apple", name: "Apple Watch Ultra 3", price: 83_990_00, specs: { Корпус: "Титан", GPS: "Двухчастотный", Автономность: "42 ч" } },
      { brand: "Samsung", name: "Galaxy Watch8 44mm", price: 31_990_00, specs: { Корпус: "Алюминий", GPS: "Да", Автономность: "40 ч" } },
      { brand: "Garmin", name: "Forerunner 265", price: 37_990_00, specs: { Корпус: "Пластик", GPS: "Да", Автономность: "13 дней" } },
      { brand: "Xiaomi", name: "Smart Band 10", price: 4_990_00, specs: { Экран: "AMOLED", GPS: "Нет", Автономность: "21 день" } },
      { brand: "Huawei", name: "Watch GT 5", price: 21_990_00, specs: { Корпус: "Сталь", GPS: "Да", Автономность: "14 дней" } },
      { brand: "Apple", name: "AirTag (4 шт.)", price: 10_990_00, specs: { Связь: "Bluetooth, UWB", Батарея: "CR2032", Защита: "IP67" } },
      { brand: "Anker", name: "PowerCore 10000", price: 2_490_00, specs: { Ёмкость: "10000 мА·ч", Мощность: "12 Вт", Порты: "USB-A" } },
    ],
  },
};

async function main() {
  console.log("Очищаю таблицы…");
  await db.execute(
    sql.raw(`TRUNCATE favorites, order_events, payments, order_items, orders, cart_items, stock, product_images, products, categories, addresses, users RESTART IDENTITY CASCADE`),
  );

  const hash = await bcrypt.hash("demo12345", 10);
  await db.insert(schema.users).values([
    { email: "admin@techstore.ru", name: "Админ", passwordHash: hash, role: "ADMIN" },
    { email: "manager@techstore.ru", name: "Менеджер", passwordHash: hash, role: "MANAGER" },
    { email: "user@techstore.ru", name: "Покупатель", passwordHash: hash, role: "CUSTOMER", phone: "+79001234567" },
  ]);

  const demo = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, "user@techstore.ru") });
  if (demo) {
    await db.insert(schema.addresses).values([
      { userId: demo.id, label: "Дом", city: "Москва", street: "ул. Тверская, д. 7", apartment: "45", comment: "Домофон 45, 3 этаж", isDefault: true },
      { userId: demo.id, label: "Работа", city: "Москва", street: "Пресненская наб., д. 12", comment: "Башня Федерация, ресепшн" },
    ]);
  }

  let count = 0;
  for (const [slug, { name, items }] of Object.entries(catalog)) {
    const [cat] = await db.insert(schema.categories).values({ name, slug }).returning();
    for (const [i, item] of items.entries()) {
      const [p] = await db
        .insert(schema.products)
        .values({
          categoryId: cat.id,
          name: item.name,
          slug: slugify(`${item.brand}-${item.name}`),
          brand: item.brand,
          price: item.price, // в копейках
          specs: item.specs,
          description: `${item.brand} ${item.name} — официальная гарантия 12 месяцев, доставка по Москве за 1 день.`,
        })
        .returning();
      // Детерминированные остатки: часть товаров заканчивается, один — нет в наличии
      const quantity = i === 3 ? 0 : ((i * 7 + slug.length) % 25) + 1;
      await db.insert(schema.stock).values({ productId: p.id, quantity });
      count++;
    }
  }

  if (demo) {
    const picks = await db.query.products.findMany({
      where: (p, { inArray }) => inArray(p.slug, ["apple-airpods-pro-3", "sony-wh-1000xm6", "apple-macbook-air-13-m4-16-256"]),
    });
    if (picks.length) await db.insert(schema.favorites).values(picks.map((p) => ({ userId: demo.id, productId: p.id })));
  }

  console.log(`Готово: 3 пользователя, ${Object.keys(catalog).length} категорий, ${count} товаров.`);
  console.log("Вход: admin@techstore.ru / manager@techstore.ru / user@techstore.ru, пароль demo12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
