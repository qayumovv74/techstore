/**
 * DEMO_STORE=1 — магазин работает как витрина: оплата через тестовый шлюз,
 * деньги не списываются, вверху каждой страницы плашка «Демо-магазин».
 *
 * Тестовый шлюз в разработке включён всегда, а на сервере — только в демо-режиме:
 * иначе любой оплатил бы заказ тестовой картой. Для настоящих продаж нужен свой модуль
 * рядом с lib/payments/mock.ts (ЮKassa, CloudPayments).
 */
export const isDemoStore = () => process.env.DEMO_STORE === "1";

export const mockPaymentsEnabled = () => process.env.NODE_ENV !== "production" || isDemoStore();
