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

const catalog: Record<string, { name: string; items: Seed[] }> = {
  smartphones: {
    name: "Смартфоны",
    items: [
      { brand: "Apple", name: "iPhone 17 Pro 256GB", price: 16_900_000, specs: { Экран: "6.3\" OLED 120 Гц", Память: "256 ГБ", Камера: "48 Мп ×3" } },
      { brand: "Apple", name: "iPhone 17 128GB", price: 11_400_000, specs: { Экран: "6.3\" OLED", Память: "128 ГБ", Камера: "48 Мп ×2" } },
      { brand: "Apple", name: "iPhone 16e 128GB", price: 7_900_000, specs: { Экран: "6.1\" OLED", Память: "128 ГБ", Камера: "48 Мп" } },
      { brand: "Samsung", name: "Galaxy S25 Ultra 512GB", price: 17_500_000, specs: { Экран: "6.9\" AMOLED", Память: "512 ГБ", Камера: "200 Мп" } },
      { brand: "Samsung", name: "Galaxy S25 256GB", price: 10_200_000, specs: { Экран: "6.2\" AMOLED", Память: "256 ГБ", Камера: "50 Мп" } },
      { brand: "Samsung", name: "Galaxy A56 128GB", price: 4_700_000, specs: { Экран: "6.7\" AMOLED", Память: "128 ГБ", Камера: "50 Мп" } },
      { brand: "Xiaomi", name: "Xiaomi 15 256GB", price: 9_300_000, specs: { Экран: "6.36\" AMOLED", Память: "256 ГБ", Камера: "50 Мп Leica" } },
      { brand: "Xiaomi", name: "Redmi Note 14 Pro 256GB", price: 3_900_000, specs: { Экран: "6.67\" AMOLED", Память: "256 ГБ", Камера: "200 Мп" } },
      { brand: "Google", name: "Pixel 10 128GB", price: 9_800_000, specs: { Экран: "6.3\" OLED", Память: "128 ГБ", Камера: "50 Мп" } },
      { brand: "Honor", name: "Honor 400 256GB", price: 5_600_000, specs: { Экран: "6.55\" AMOLED", Память: "256 ГБ", Камера: "200 Мп" } },
    ],
  },
  laptops: {
    name: "Ноутбуки",
    items: [
      { brand: "Apple", name: "MacBook Air 13 M4 16/256", price: 14_200_000, specs: { Процессор: "Apple M4", ОЗУ: "16 ГБ", SSD: "256 ГБ" } },
      { brand: "Apple", name: "MacBook Pro 14 M4 Pro 24/512", price: 26_900_000, specs: { Процессор: "M4 Pro", ОЗУ: "24 ГБ", SSD: "512 ГБ" } },
      { brand: "Lenovo", name: "ThinkPad X1 Carbon Gen 13", price: 22_400_000, specs: { Процессор: "Core Ultra 7", ОЗУ: "32 ГБ", SSD: "1 ТБ" } },
      { brand: "Lenovo", name: "IdeaPad Slim 5 14", price: 8_100_000, specs: { Процессор: "Ryzen 7", ОЗУ: "16 ГБ", SSD: "512 ГБ" } },
      { brand: "ASUS", name: "ROG Zephyrus G14", price: 24_700_000, specs: { Процессор: "Ryzen AI 9", ОЗУ: "32 ГБ", Видео: "RTX 5070 Ti" } },
      { brand: "ASUS", name: "Zenbook 14 OLED", price: 11_300_000, specs: { Процессор: "Core Ultra 5", ОЗУ: "16 ГБ", SSD: "1 ТБ" } },
      { brand: "HP", name: "Victus 15 RTX 4050", price: 9_600_000, specs: { Процессор: "Core i5", ОЗУ: "16 ГБ", Видео: "RTX 4050" } },
      { brand: "Acer", name: "Aspire 5 15", price: 5_900_000, specs: { Процессор: "Core i5", ОЗУ: "8 ГБ", SSD: "512 ГБ" } },
      { brand: "Dell", name: "XPS 13", price: 18_800_000, specs: { Процессор: "Snapdragon X Elite", ОЗУ: "16 ГБ", SSD: "512 ГБ" } },
      { brand: "MSI", name: "Katana 15", price: 12_500_000, specs: { Процессор: "Core i7", ОЗУ: "16 ГБ", Видео: "RTX 4060" } },
    ],
  },
  audio: {
    name: "Аудио",
    items: [
      { brand: "Apple", name: "AirPods Pro 3", price: 3_400_000, specs: { Тип: "TWS", Шумоподавление: "Да", Автономность: "8 ч" } },
      { brand: "Apple", name: "AirPods 4", price: 2_000_000, specs: { Тип: "TWS", Шумоподавление: "Нет", Автономность: "5 ч" } },
      { brand: "Sony", name: "WH-1000XM6", price: 5_200_000, specs: { Тип: "Накладные", Шумоподавление: "Да", Автономность: "30 ч" } },
      { brand: "Sony", name: "WF-1000XM5", price: 3_600_000, specs: { Тип: "TWS", Шумоподавление: "Да", Автономность: "8 ч" } },
      { brand: "Samsung", name: "Galaxy Buds3 Pro", price: 2_700_000, specs: { Тип: "TWS", Шумоподавление: "Да", Автономность: "6 ч" } },
      { brand: "JBL", name: "Charge 6", price: 2_100_000, specs: { Тип: "Колонка", Защита: "IP68", Автономность: "24 ч" } },
      { brand: "JBL", name: "Flip 7", price: 1_500_000, specs: { Тип: "Колонка", Защита: "IP68", Автономность: "14 ч" } },
      { brand: "Marshall", name: "Major V", price: 1_900_000, specs: { Тип: "Накладные", Шумоподавление: "Нет", Автономность: "100 ч" } },
      { brand: "Xiaomi", name: "Redmi Buds 6 Pro", price: 700_000, specs: { Тип: "TWS", Шумоподавление: "Да", Автономность: "9.5 ч" } },
      { brand: "Bose", name: "QuietComfort Ultra", price: 5_400_000, specs: { Тип: "Накладные", Шумоподавление: "Да", Автономность: "24 ч" } },
    ],
  },
  tablets: {
    name: "Планшеты",
    items: [
      { brand: "Apple", name: "iPad Air 11 M3 128GB", price: 8_900_000, specs: { Экран: "11\" Liquid Retina", Память: "128 ГБ", Чип: "M3" } },
      { brand: "Apple", name: "iPad 11 128GB", price: 5_100_000, specs: { Экран: "11\"", Память: "128 ГБ", Чип: "A16" } },
      { brand: "Apple", name: "iPad Pro 13 M4 256GB", price: 18_300_000, specs: { Экран: "13\" OLED", Память: "256 ГБ", Чип: "M4" } },
      { brand: "Samsung", name: "Galaxy Tab S10 FE", price: 6_200_000, specs: { Экран: "10.9\"", Память: "128 ГБ", Стилус: "S Pen" } },
      { brand: "Samsung", name: "Galaxy Tab S10 Ultra", price: 15_600_000, specs: { Экран: "14.6\" AMOLED", Память: "256 ГБ", Стилус: "S Pen" } },
      { brand: "Xiaomi", name: "Xiaomi Pad 7", price: 4_300_000, specs: { Экран: "11.2\" 144 Гц", Память: "128 ГБ", Чип: "Snapdragon 7+" } },
      { brand: "Lenovo", name: "Tab P12", price: 3_800_000, specs: { Экран: "12.7\"", Память: "128 ГБ", Стилус: "Да" } },
      { brand: "Honor", name: "Pad 9", price: 3_300_000, specs: { Экран: "12.1\"", Память: "256 ГБ", Чип: "Snapdragon 6" } },
    ],
  },
  wearables: {
    name: "Часы и гаджеты",
    items: [
      { brand: "Apple", name: "Apple Watch Series 11 46mm", price: 5_500_000, specs: { Корпус: "Алюминий", GPS: "Да", Автономность: "24 ч" } },
      { brand: "Apple", name: "Apple Watch Ultra 3", price: 10_900_000, specs: { Корпус: "Титан", GPS: "Двухчастотный", Автономность: "42 ч" } },
      { brand: "Samsung", name: "Galaxy Watch8 44mm", price: 4_100_000, specs: { Корпус: "Алюминий", GPS: "Да", Автономность: "40 ч" } },
      { brand: "Garmin", name: "Forerunner 265", price: 5_000_000, specs: { Корпус: "Пластик", GPS: "Да", Автономность: "13 дней" } },
      { brand: "Xiaomi", name: "Smart Band 10", price: 600_000, specs: { Экран: "AMOLED", GPS: "Нет", Автономность: "21 день" } },
      { brand: "Huawei", name: "Watch GT 5", price: 2_900_000, specs: { Корпус: "Сталь", GPS: "Да", Автономность: "14 дней" } },
      { brand: "Apple", name: "AirTag (4 шт.)", price: 1_400_000, specs: { Связь: "Bluetooth, UWB", Батарея: "CR2032", Защита: "IP67" } },
      { brand: "Anker", name: "Power Bank 20000 мА·ч 65 Вт", price: 800_000, specs: { Ёмкость: "20000 мА·ч", Мощность: "65 Вт", Порты: "2×USB-C" } },
    ],
  },
};

async function main() {
  console.log("Очищаю таблицы…");
  await db.execute(
    sql.raw(`TRUNCATE order_events, payments, order_items, orders, cart_items, stock, product_images, products, categories, addresses, users RESTART IDENTITY CASCADE`),
  );

  const hash = await bcrypt.hash("demo12345", 10);
  await db.insert(schema.users).values([
    { email: "admin@techstore.uz", name: "Админ", passwordHash: hash, role: "ADMIN" },
    { email: "manager@techstore.uz", name: "Менеджер", passwordHash: hash, role: "MANAGER" },
    { email: "user@techstore.uz", name: "Покупатель", passwordHash: hash, role: "CUSTOMER", phone: "+998 90 123 45 67" },
  ]);

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
          price: item.price,
          specs: item.specs,
          description: `${item.brand} ${item.name} — официальная гарантия 12 месяцев, доставка по Ташкенту за 1 день.`,
        })
        .returning();
      // Детерминированные остатки: часть товаров заканчивается, один — нет в наличии
      const quantity = i === 3 ? 0 : ((i * 7 + slug.length) % 25) + 1;
      await db.insert(schema.stock).values({ productId: p.id, quantity });
      count++;
    }
  }

  console.log(`Готово: 3 пользователя, ${Object.keys(catalog).length} категорий, ${count} товаров.`);
  console.log("Вход: admin@techstore.uz / manager@techstore.uz / user@techstore.uz, пароль demo12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
