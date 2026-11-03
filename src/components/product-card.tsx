import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { ProductArt } from "./product-art";

export type CardProduct = {
  slug: string;
  name: string;
  brand: string;
  price: number;
  available: number;
  categorySlug: string;
  image: string | null;
};

export function ProductCard({ p }: { p: CardProduct }) {
  const left = Number(p.available);
  return (
    <Link
      href={`/product/${p.slug}`}
      className="group flex w-full flex-col rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
    >
      {p.image ? (
        <div className="relative aspect-square overflow-hidden rounded-xl bg-white">
          <Image
            src={p.image}
            alt={p.name}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <ProductArt category={p.categorySlug} brand={p.brand} className="aspect-square rounded-xl" />
      )}
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-muted">{p.brand}</p>
      <h3 className="mt-1 line-clamp-2 min-h-[2.5em] text-sm font-semibold leading-tight group-hover:text-primary">
        {p.name}
      </h3>
      <p className="mt-auto pt-3 text-base font-bold">{formatPrice(p.price)}</p>
      <p className={`text-xs ${left > 0 ? "text-primary" : "text-danger"}`}>
        {left > 0 ? (left <= 3 ? `Осталось ${left} шт.` : "В наличии") : "Нет в наличии"}
      </p>
    </Link>
  );
}
