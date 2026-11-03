import Image from "next/image";
import Link from "next/link";
import { formatPrice, installment } from "@/lib/format";
import { ProductArt } from "./product-art";
import { FavoriteButton } from "./favorite-button";

export type CardProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  specs: Record<string, string>;
  available: number;
  categorySlug: string;
  image: string | null;
};

/** Карточка в духе крупных магазинов техники: фото, ключевые характеристики, цена, рассрочка, наличие */
export function ProductCard({ p, favored = false }: { p: CardProduct; favored?: boolean }) {
  const left = Number(p.available);
  const href = `/product/${p.slug}`;
  const specLine = Object.values(p.specs).slice(0, 3).join(" · ");

  return (
    <article className="group relative flex w-full flex-col rounded-2xl border border-border bg-surface p-3 transition-shadow hover:shadow-[0_8px_30px_-12px_rgb(12_112_117/0.35)]">
      <FavoriteButton productId={p.id} initial={favored} className="absolute right-4 top-4 z-10 size-9 bg-surface/90 backdrop-blur" />

      <Link href={href} tabIndex={-1} aria-hidden className="block">
        {p.image ? (
          <div className="relative aspect-square overflow-hidden rounded-xl bg-white">
            <Image src={p.image} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-contain p-3 transition-transform duration-300 group-hover:scale-105" />
          </div>
        ) : (
          <ProductArt category={p.categorySlug} brand={p.brand} className="aspect-square rounded-xl" />
        )}
      </Link>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-muted">{p.brand}</p>
      <h3 className="mt-1 text-sm font-semibold leading-tight">
        <Link href={href} className="line-clamp-2 min-h-[2.5em] hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
          {p.name}
        </Link>
      </h3>
      {specLine ? <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-muted">{specLine}</p> : null}

      <div className="mt-auto pt-3">
        <p className="price text-lg font-bold">{formatPrice(p.price)}</p>
        <p className="text-xs text-muted">от {installment(p.price)} ₽/мес в рассрочку</p>
        <p className={`mt-1 text-xs ${left > 0 ? "text-primary" : "text-danger"}`}>
          {left > 0 ? (left <= 3 ? `Осталось ${left} шт. · доставим завтра` : "В наличии · доставим завтра") : "Нет в наличии"}
        </p>
        <Link
          href={href}
          className={`mt-3 flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
            left > 0 ? "bg-primary text-on-primary hover:bg-primary-hover" : "border border-border text-muted hover:bg-surface-2"
          }`}
        >
          {left > 0 ? "Купить" : "Подробнее"}
        </Link>
      </div>
    </article>
  );
}
