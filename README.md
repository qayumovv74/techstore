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

После перезагрузки компьютера достаточно одной команды: `npm run go` — поднимет базу и сайт.

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

## Почта

Письма: восстановление пароля, заказ оформлен, заказ оплачен, смена статуса.

- **Без настройки** письма уходят в тестовый ящик [Ethereal](https://ethereal.email): ссылка на просмотр — в консоли сервера и на странице «Забыли пароль?».
- **Настоящая отправка** — заполни в `.env`:

```
# Gmail: включи двухэтапную проверку → myaccount.google.com/apppasswords → создай пароль приложения
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=твой@gmail.com
SMTP_PASS=пароль_приложения_16_символов
MAIL_FROM=TechStore <твой@gmail.com>
```

Для Яндекса: `SMTP_HOST=smtp.yandex.ru`, пароль приложения в id.yandex.ru → Безопасность. После правки `.env` перезапусти `npm run dev`.

## Оплата

Тестовый шлюз устроен как настоящий: магазин создаёт платёж → покупатель платит на странице шлюза → шлюз шлёт на `/api/payments/webhook` уведомление, подписанное HMAC-SHA256. Обработка идемпотентна: повторный вебхук ничего не ломает. Товар резервируется на 15 минут; просроченные резервы снимаются автоматически и по `GET /api/cron/release` (для cron на сервере).

Тестовые карты: `4242 4242 4242 4242` — успех, `4000 0000 0000 0002` — отказ банка.

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
- [x] 3. Заказ: корзина, оформление, тестовая оплата с вебхуком, письма
- [ ] 4. Админка: ~~заказы, пользователи, дашборд~~ (готово), товары, остатки
- [ ] 5. Realtime (Socket.IO + Redis), тесты, деплой на VPS
