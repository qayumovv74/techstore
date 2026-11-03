import type { Metadata } from "next";
import Link from "next/link";
import { IconCart } from "@/components/icons";

export const metadata: Metadata = { title: "Корзина" };

export default function CartPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <IconCart className="size-14 text-muted" />
      <h1 className="mt-4 text-2xl font-bold">Корзина пуста</h1>
      <p className="mt-2 text-sm text-muted">Оформление заказа появится на этапе 3. Пока можно выбрать товары и добавить их в избранное.</p>
      <Link href="/catalog" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-on-primary hover:bg-primary-hover">
        В каталог
      </Link>
    </main>
  );
}
