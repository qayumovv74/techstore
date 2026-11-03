import type { Metadata } from "next";
import { Suspense } from "react";
import { getCity } from "@/lib/city";
import { deliveryInfo } from "@/data/cities";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Доставка и самовывоз" };

export default function DeliveryPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold">Доставка и самовывоз</h1>
      <Suspense fallback={<div className="mt-6 h-32 animate-pulse rounded-2xl bg-surface-2" />}>
        <ForCity />
      </Suspense>
      <section className="mt-10 space-y-3 text-sm leading-relaxed text-muted">
        <h2 className="text-lg font-bold text-text">Как это работает</h2>
        <p>Курьер звонит за час до приезда. Можно проверить товар при получении и отказаться, если что-то не так.</p>
        <p>Заказ в пункте выдачи хранится 7 дней. Для получения нужен номер заказа и код из SMS.</p>
        <p>Крупную технику поднимаем на этаж бесплатно, если есть лифт.</p>
      </section>
    </main>
  );
}

async function ForCity() {
  const city = await getCity();
  const d = deliveryInfo(city);
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm text-muted">Курьером · {city}</p>
        <p className="mt-1 text-xl font-bold">{d.courier}</p>
        <p className="mt-1 text-sm">{d.courierPrice ? formatPrice(d.courierPrice) : "Бесплатно"}</p>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm text-muted">Самовывоз · {city}</p>
        <p className="mt-1 text-xl font-bold">{d.pickup}</p>
        <p className="mt-1 text-sm">Бесплатно</p>
      </div>
      <p className="text-xs text-muted sm:col-span-2">Другой город можно выбрать в шапке сайта — сроки пересчитаются.</p>
    </div>
  );
}
