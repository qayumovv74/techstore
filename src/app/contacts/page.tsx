import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Контакты" };

const rows = [
  ["Интернет-магазин", "Круглосуточно"],
  ["Поддержка", "Пн–Вс 9:00–21:00"],
  ["Пункты выдачи", "Пн–Вс 10:00–22:00"],
];

export default function ContactsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold">Контакты</h1>
      <dl className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-5 py-4 text-sm">
            <dt className="text-muted">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <Link href="/support" className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-ink/60 px-5 py-4 text-sm backdrop-blur-md transition-colors hover:border-violet/50">
        <span><span className="font-semibold">Написать в поддержку</span><br /><span className="text-muted">Ответим на почту в течение рабочего дня</span></span>
        <span className="text-lilac">→</span>
      </Link>
      <p className="mt-6 text-xs text-muted">TechStore — учебный проект. Телефонов и адресов магазинов нет, это не настоящий магазин.</p>
    </main>
  );
}
