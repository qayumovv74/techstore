import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Clock, CreditCard, Package, Truck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { supportPublicEmail } from "@/lib/support";
import { SupportForm } from "./support-form";

export const metadata: Metadata = { title: "Поддержка" };

const faq = [
  { href: "/account/orders", icon: Package, title: "Где мой заказ?", text: "Статус обновляется в кабинете в реальном времени" },
  { href: "/delivery", icon: Truck, title: "Доставка", text: "Сроки и стоимость по вашему городу" },
  { href: "/installment", icon: CreditCard, title: "Рассрочка 0-0-12", text: "Без переплаты на 12 месяцев" },
];

export default function SupportPage({ searchParams }: PageProps<"/support">) {
  const publicEmail = supportPublicEmail();
  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-8 lg:grid-cols-[1fr_340px]">
      <section className="rounded-[2rem] border border-white/10 bg-ink/60 p-6 backdrop-blur-xl sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lilac">Поддержка</p>
        <h1 className="mt-2 text-3xl font-bold">Напишите нам</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Что-то не так с заказом, доставкой или товаром? Опишите ситуацию — ответим на вашу почту в течение рабочего дня.
          {publicEmail ? (
            <>
              {" "}Или напишите напрямую: <a href={`mailto:${publicEmail}`} className="font-semibold text-lilac hover:text-white">{publicEmail}</a>
            </>
          ) : null}
        </p>
        <div className="mt-6">
          <Suspense fallback={<SupportForm />}>
            <Prefilled searchParams={searchParams} />
          </Suspense>
        </div>
      </section>

      <aside className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-glass p-5 backdrop-blur-md">
          <Clock className="size-5 shrink-0 text-lilac" aria-hidden />
          <p className="text-sm"><span className="font-semibold">Пн–Вс 9:00–21:00</span><br /><span className="text-muted">Обычно отвечаем за пару часов</span></p>
        </div>
        <p className="mt-2 px-1 text-xs uppercase tracking-widest text-muted">Может, ответ уже есть</p>
        {faq.map(({ href, icon: Icon, title, text }) => (
          <Link key={href} href={href} className="flex items-center gap-3 rounded-3xl border border-white/10 bg-glass p-4 backdrop-blur-md transition-colors hover:border-violet/50">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet/15 text-lilac"><Icon className="size-5" aria-hidden /></span>
            <span className="text-sm"><span className="font-semibold">{title}</span><br /><span className="text-xs text-muted">{text}</span></span>
          </Link>
        ))}
      </aside>
    </main>
  );
}

async function Prefilled({ searchParams }: { searchParams: PageProps<"/support">["searchParams"] }) {
  const [user, sp] = await Promise.all([getCurrentUser(), searchParams]);
  const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  return <SupportForm name={user?.name} email={user?.email} order={str(sp.order)} topic={str(sp.topic)} />;
}
