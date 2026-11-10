import { connection } from "next/server";
import { isDemoStore } from "@/lib/demo";

/** Плашка демо-режима. connection() — читаем переменную при запросе, а не при сборке образа. */
export async function DemoBanner() {
  await connection();
  if (!isDemoStore()) return null;
  return (
    <div className="relative z-50 bg-violet px-4 py-1.5 text-center text-xs font-semibold text-on-primary">
      Демо-магазин: оплата тестовая, деньги не списываются, заказы не доставляются
    </div>
  );
}
