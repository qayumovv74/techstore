import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CreditCard, ShieldCheck, Truck } from "lucide-react";
import { getCatalog, getCategories, parseFilters } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { ProductArt } from "@/components/product-art";
import { getFavoriteIds } from "@/lib/favorites";
import { getCartIds } from "@/lib/cart";
import { Hero3D } from "@/components/ui/hero-3d";
import { buttonVariants } from "@/components/ui/button-variants";
import { ScrambleText } from "@/components/scramble-text";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/cn";

const perks = [
  { icon: Truck, title: "Доставка завтра", text: "Курьером по Москве, самовывоз — сегодня" },
  { icon: ShieldCheck, title: "Официальная гарантия", text: "Чек и гарантийный талон к каждому заказу" },
  { icon: CreditCard, title: "Рассрочка 0-0-12", text: "Без первого взноса и переплаты на год" },
];

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <section className="relative grid overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(110%_90%_at_80%_30%,rgb(61_44_141/0.55),rgb(4_5_46/0.55)_50%,rgb(2_1_10/0.75))] px-6 pt-10 sm:px-12 sm:pt-14 md:grid-cols-[1.05fr_1fr] md:items-center md:pb-14">
        <div className="relative z-10 max-w-xl">
          <p className="animate-element inline-flex items-center gap-2 rounded-full border border-violet/40 bg-violet/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-lilac">
            <span className="size-1.5 rounded-full bg-lilac shadow-[0_0_10px_2px_rgb(196_181_232/0.8)]" />
            <ScrambleText>Новинки · доставка завтра</ScrambleText>
          </p>
          <h1 className="animate-element animate-delay-100 mt-5 text-3xl font-bold leading-tight sm:text-5xl">
            Электроника с официальной <span className="shimmer-text">гарантией</span>
          </h1>
          <p className="animate-element animate-delay-200 mt-4 text-sm text-lilac/80 sm:text-base">
            Смартфоны, ноутбуки, наушники и гаджеты. Курьер привезёт завтра, а из пункта выдачи можно забрать уже сегодня.
          </p>
          <div className="animate-element animate-delay-300 mt-7 flex flex-wrap gap-3">
            <Link href="/catalog" className={cn(buttonVariants({ size: "lg" }), "group font-semibold")}>
              Перейти в каталог
              <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <Link href="/catalog?category=smartphones" className={buttonVariants({ variant: "outline", size: "lg", className: "font-semibold" })}>
              Смартфоны
            </Link>
          </div>
        </div>
        <Hero3D className="-mx-6 h-[320px] sm:h-[400px] md:mx-0 md:h-[440px]" />
      </section>

      <Reveal className="mt-6 grid gap-3 sm:grid-cols-3">
        {perks.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-glass p-4 backdrop-blur-md">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet/20 text-lilac">
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="text-sm leading-snug">
              <p className="font-semibold">{title}</p>
              <p className="text-xs text-muted">{text}</p>
            </div>
          </div>
        ))}
      </Reveal>

      <Suspense fallback={<GridSkeleton />}>
        <Sections />
      </Suspense>
    </main>
  );
}

async function Sections() {
  const [categories, favs, cartIds] = await Promise.all([getCategories(), getFavoriteIds(), getCartIds()]);
  const sections = await Promise.all(
    categories.map(async (c) => ({ c, data: await getCatalog(parseFilters({ category: c.slug, stock: "1" })) })),
  );

  return (
    <div className="mt-10 flex flex-col gap-14">
      <nav aria-label="Категории">
        <ul className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0">
          {categories.map((c) => (
            <li key={c.id} className="w-28 shrink-0 snap-start sm:w-auto">
              <Link href={`/catalog?category=${c.slug}`}
                className="group flex h-full flex-col items-center gap-2 rounded-2xl border border-white/10 bg-glass p-3 text-center text-xs font-semibold backdrop-blur-md transition-colors hover:border-violet/60 sm:text-sm">
                <ProductArt category={c.slug} brand="" className="aspect-[4/3] w-full rounded-xl transition-transform duration-300 group-hover:scale-[1.03]" />
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {sections.map(({ c, data }) => (
        <Reveal key={c.id}>
          <section aria-labelledby={`cat-${c.slug}`}>
            <div className="flex items-baseline justify-between gap-4">
              <h2 id={`cat-${c.slug}`} className="text-xl font-bold">{c.name}</h2>
              <Link href={`/catalog?category=${c.slug}`} className="group inline-flex items-center gap-1 text-sm font-semibold text-lilac hover:text-white">
                Смотреть все <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {data.products.slice(0, 4).map((p) => (
                <li key={p.id} className="flex">
                  <ProductCard p={p} favored={favs.has(p.id)} inCart={cartIds.has(p.id)} />
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      ))}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-surface-2/60" />
      ))}
    </div>
  );
}
