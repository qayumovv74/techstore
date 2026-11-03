# TechStore

Интернет-магазин техники: витрина, корзина, имитация оплаты, админка и обновления в реальном времени.
Учебный проект для портфолио.

**Стек:** Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · PostgreSQL + Drizzle ORM · свои сессии на JWT (jose + bcrypt) · Zod

## Быстрый старт

```bash
cp .env.example .env          # затем поменяй SESSION_SECRET
npm install
npm run db:local              # PostgreSQL без Docker (бинарники из node_modules)
#   или: npm run db:up        # PostgreSQL и Redis в Docker
npm run db:migrate            # создать таблицы
npm run db:seed               # 46 товаров и демо-пользователи
npm run dev                   # http://localhost:3000
```

`npm run db:local stop` — остановить локальную базу. Данные лежат в `.pgdata/`.

Демо-доступ (пароль `demo12345`): `admin@techstore.ru`, `manager@techstore.ru`, `user@techstore.ru`.

## Структура

```
src/
  app/
    (auth)/        вход, регистрация, server actions
    account/       кабинет покупателя
    admin/         админка (MANAGER, ADMIN)
    page.tsx       главная с каталогом
  components/      UI-примитивы и шапка
  db/
    schema.ts      11 таблиц и связи
    index.ts       пул соединений
  lib/
    auth.ts        Data Access Layer: getCurrentUser, requireRole
    session.ts     cookie-сессия
    session-token  подпись/проверка JWT (общая для proxy и сокетов)
  proxy.ts         быстрая проверка доступа к /account и /admin
drizzle/           SQL-миграции
scripts/seed.ts    демо-данные
```

## Ключевые решения

- **Безопасность в два слоя.** `proxy.ts` отсекает гостей до рендера, но права ещё раз проверяет каждая страница и Server Action через `lib/auth.ts`.
- **Цены в копейках целым числом** — без ошибок округления.
- **Снимки данных в заказе** (`name_at_purchase`, `price_at_purchase`, `address_snapshot`) — смена цены не меняет старые заказы.
- **Резерв остатков** (`stock.reserved`) — два покупателя не купят последний товар одновременно.
- **Защита входа:** httpOnly-cookie, `sameSite=lax`, одинаковое время ответа для существующих и несуществующих email, проверка `?next=` от открытых редиректов.

## Фото товаров

Реальные фото со свободными лицензиями с Wikimedia Commons, авторы указаны под фото и на странице `/photo-credits`.

Как они попали в проект (`scripts/photos/`):

1. `search.mjs` — ищет кандидатов по названию модели, только CC0 / CC BY / CC BY-SA.
2. Подходящие снимки выбраны вручную (`selection.json`), `download.mjs` скачивает их вместе с автором и лицензией.
3. `process.py` — приводит к квадрату 1000×1000 WebP.
4. `npm run images:import` — записывает фото и авторов в базу.

Свои фото: положи `1.webp`, `2.webp` в `public/products/<slug>/` и запусти `npm run images:import`. Товары без фото показывают иллюстрацию категории, список — `public/products/_CHECKLIST.md`.

## Скрипты

| Команда | Что делает |
| --- | --- |
| `npm run dev` | Режим разработки |
| `npm run db:local` | Запустить локальный PostgreSQL (`stop` — остановить) |
| `npm run build && npm start` | Продакшен-сборка |
| `npm run db:generate` | Миграция из изменений `schema.ts` |
| `npm run db:migrate` | Применить миграции |
| `npm run db:seed` | Залить демо-данные (очищает таблицы) |
| `npm run db:studio` | Drizzle Studio — просмотр БД в браузере |
| `npm run images:import` | Подтянуть фото из `public/products/<slug>/` в базу |
| `npm run test:e2e` | E2E-тесты Playwright (десктоп + телефон) |

## Этапы

- [x] 1. Основа: проект, БД, вход и роли
- [x] 2. Каталог: фильтры, поиск, карточка товара
- [ ] 3. Заказ: ~~корзина~~ (готова), оформление, mock-оплата с вебхуком
- [ ] 4. Админка: товары, остатки, заказы, дашборд
- [ ] 5. Realtime (Socket.IO + Redis), тесты, деплой на VPS
