import type { Metadata } from "next";

export const metadata: Metadata = { title: "Рассрочка 0-0-12" };

export default function InstallmentPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold">Рассрочка 0-0-12</h1>
      <p className="mt-3 text-muted">Без первого взноса и переплаты, на 12 месяцев. Ежемесячный платёж указан на карточке каждого товара.</p>
      <ol className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          ["Положите товар в корзину", "Сумма заказа — от 10 000 ₽."],
          ["Выберите оплату «Рассрочка»", "Заявку рассмотрят за пару минут."],
          ["Платите равными частями", "Без процентов, если платить вовремя."],
        ].map(([title, text], i) => (
          <li key={title} className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-sm font-bold text-primary">{i + 1}</p>
            <p className="mt-2 font-semibold">{title}</p>
            <p className="mt-1 text-sm text-muted">{text}</p>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-xs text-muted">Это демо-проект: оформление рассрочки здесь не работает.</p>
    </main>
  );
}
