import Image from "next/image";
import Link from "next/link";
import { formatPrice, installment } from "@/lib/format";
import { ProductArt } from "./product-art";
import { FavoriteButton } from "./favorite-button";
import { AddToCart } from "./add-to-cart";
import { GlowCard } from "./ui/spotlight-card";

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
/** eager — для карточек первого экрана: их фото и есть LCP, ленивая загрузка его тормозит */
export function ProductCard({ p, favored = false, inCart = false, eager = false }: { p: CardProduct; favored?: boolean; inCart?: boolean; eager?: boolean }) {
  const left = Number(p.available);
  const href = `/product/${p.slug}`;
  const specLine = Object.values(p.specs).slice(0, 3).join(" · ");

  return (
    <GlowCard as="article" customSize className="group flex w-full flex-col gap-0 p-3 transition-shadow duration-300 hover:shadow-[0_24px_50px_-20px_rgb(145_107_191/0.45)]">
      <FavoriteButton productId={p.id} initial={favored} className="absolute right-5 top-5 z-10 size-9 bg-ink/50 backdrop-blur" />

      <Link href={href} tabIndex={-1} aria-hidden className="block">
        {p.image ? (
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_40%,#ffffff_0%,#ece8f6_100%)]">
            <Image src={p.image} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" loading={eager ? "eager" : "lazy"}
              className="object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
        ) : (
          <ProductArt category={p.categorySlug} brand={p.brand} className="aspect-square rounded-2xl" />
        )}
      </Link>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-lilac/70">{p.brand}</p>
      <h3 className="mt-1 text-sm font-semibold leading-tight">
        <Link href={href} className="line-clamp-2 min-h-[2.5em] hover:text-lilac focus-visible:outline-2 focus-visible:outline-primary">
          {p.name}
        </Link>
      </h3>
      {specLine ? <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-muted">{specLine}</p> : null}

      <div className="mt-auto pt-3">
        <p className="price text-lg font-bold">{formatPrice(p.price)}</p>
        <p className="text-xs text-muted">от {installment(p.price)} ₽/мес в рассрочку</p>
        <p className={`mt-1 text-xs ${left > 0 ? "text-lilac" : "text-danger"}`}>
          {left > 0 ? (left <= 3 ? `Осталось ${left} шт.` : "В наличии") : "Нет в наличии"}
        </p>
        <div className="mt-3">
          <AddToCart productId={p.id} inCart={inCart} disabled={left <= 0} />
        </div>
      </div>
    </GlowCard>
  );
}
