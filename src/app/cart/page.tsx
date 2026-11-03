import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getCart, MAX_QTY } from "@/lib/cart";
import { getCity } from "@/lib/city";
import { deliveryInfo } from "@/data/cities";
import { formatPrice, pluralize } from "@/lib/format";
import { ProductArt } from "@/components/product-art";
import { IconCart } from "@/components/icons";
import { QtyControl } from "./qty";

export const metadata: Metadata = { title: "Корзина" };

export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-surface-2" />}>
        <Cart />
      </Suspense>
    </main>
  );
}

async function Cart() {
  const [cart, city] = await Promise.all([getCart(), getCity()]);
  const delivery = deliveryInfo(city);

  if (!cart.items.length) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
        <IconCart className="size-14 text-muted" />
        <h1 className="mt-4 text-2xl font-bold">Корзина пуста</h1>
        <p className="mt-2 text-sm text-muted">Загляните в каталог — там много интересного.</p>
        <Link href="/catalog" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-on-primary hover:bg-primary-hover">
          В каталог
        </Link>
      </div>
    );
  }

  const outOfStock = cart.items.some((i) => i.qty > i.available);

  return (
    <>
      <h1 className="text-2xl font-bold sm:text-3xl">
        Корзина <span className="text-base font-normal text-muted">{cart.count} {pluralize(cart.count, ["товар", "товара", "товаров"])}</span>
      </h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <ul className="flex flex-col gap-3">
          {cart.items.map((item) => (
            <li key={item.id} className="flex gap-4 rounded-2xl border border-border bg-surface p-4">
              <Link href={`/product/${item.slug}`} className="w-24 shrink-0 sm:w-28">
                {item.image ? (
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-white">
                    <Image src={item.image} alt="" fill sizes="112px" className="object-cover" />
                  </div>
                ) : (
                  <ProductArt category={item.categorySlug} brand="" className="aspect-square rounded-xl" />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{item.brand}</p>
                  <Link href={`/product/${item.slug}`} className="mt-0.5 block font-semibold hover:text-primary">{item.name}</Link>
                  {item.qty > item.available ? (
                    <p className="mt-1 text-xs text-danger">
                      {item.available > 0 ? `В наличии только ${item.available} шт.` : "Закончился — удалите из корзины"}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    <QtyControl productId={item.id} qty={item.qty} max={Math.min(item.available, MAX_QTY)} name={item.name} />
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="text-lg font-bold">{formatPrice(item.price * item.qty)}</p>
                  {item.qty > 1 ? <p className="text-xs text-muted">{formatPrice(item.price)} за шт.</p> : null}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-28">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Товары ({cart.count})</dt><dd>{formatPrice(cart.total)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-muted">Доставка, {city}</dt>
              <dd>{delivery.courierPrice ? formatPrice(delivery.courierPrice) : "бесплатно"}</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="font-semibold">Итого</span>
            <span className="text-2xl font-bold">{formatPrice(cart.total + delivery.courierPrice)}</span>
          </div>
          <p className="mt-1 text-xs text-muted">Курьер привезёт {delivery.courier}</p>
          {outOfStock ? (
            <p className="mt-5 rounded-xl bg-danger/10 px-3 py-2 text-center text-sm text-danger">Уберите товары, которых нет в наличии</p>
          ) : (
            <Link href="/checkout" className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-on-primary hover:bg-primary-hover">
              Оформить заказ
            </Link>
          )}
        </aside>
      </div>
    </>
  );
}
