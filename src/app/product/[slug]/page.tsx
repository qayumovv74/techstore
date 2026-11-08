import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProduct, getSimilar } from "@/lib/catalog";
import { formatPrice, installment } from "@/lib/format";
import { getFavoriteIds } from "@/lib/favorites";
import { getCartIds } from "@/lib/cart";
import { getCity } from "@/lib/city";
import { deliveryInfo } from "@/data/cities";
import { FavoriteButton } from "@/components/favorite-button";
import { AddToCart } from "@/components/add-to-cart";
import { ProductArt } from "@/components/product-art";
import { ProductCard } from "@/components/product-card";
import { Gallery } from "./gallery";
import { ProductReviews } from "./reviews";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">) {
  const product = await getProduct((await params).slug);
  return product
    ? { title: `${product.brand} ${product.name}`, description: product.description }
    : { title: "Товар не найден" };
}

export default function ProductPage({ params }: PageProps<"/product/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <Suspense fallback={<div className="h-[480px] animate-pulse rounded-2xl bg-surface-2" />}>
        <Product params={params} />
      </Suspense>
    </main>
  );
}

async function Product({ params }: { params: PageProps<"/product/[slug]">["params"] }) {
  const [product, favs, city, cartIds] = await Promise.all([getProduct((await params).slug), getFavoriteIds(), getCity(), getCartIds()]);
  const delivery = deliveryInfo(city);
  if (!product) notFound();

  const specs = Object.entries(product.specs);
  const left = product.available;

  return (
    <>
      <nav aria-label="Хлебные крошки" className="text-xs text-muted">
        <Link href="/" className="hover:text-primary">Главная</Link> /{" "}
        <Link href={`/catalog?category=${product.category.slug}`} className="hover:text-primary">{product.category.name}</Link> /{" "}
        <span>{product.name}</span>
      </nav>

      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        {product.images.length ? (
          <Gallery images={product.images} alt={`${product.brand} ${product.name}`} />
        ) : (
          <ProductArt category={product.category.slug} brand={product.brand} className="aspect-square rounded-2xl border border-border" />
        )}

        <div className="flex flex-col">
          <Link href={`/catalog?brand=${encodeURIComponent(product.brand)}`}
            className="text-xs font-semibold uppercase tracking-widest text-muted hover:text-primary">
            {product.brand}
          </Link>
          <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">{product.name}</h1>

          <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-3xl font-bold">{formatPrice(product.price)}</p>
                <p className="mt-1 text-sm text-muted">или от {installment(product.price)} ₽/мес · рассрочка 0-0-12</p>
              </div>
              <FavoriteButton productId={product.id} initial={favs.has(product.id)} className="size-11 border border-border" />
            </div>
            <p className={`mt-1 text-sm ${left > 0 ? "text-primary" : "text-danger"}`}>
              {left > 0 ? (left <= 3 ? `Осталось ${left} шт. — успейте` : `В наличии: ${left} шт.`) : "Нет в наличии"}
            </p>
            <div className="mt-4">
              <AddToCart productId={product.id} inCart={cartIds.has(product.id)} disabled={left <= 0} size="lg" />
            </div>
            <dl className="mt-5 grid gap-3 border-t border-border pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Курьером, {city}</dt>
                <dd className="font-medium">{delivery.courier} · {delivery.courierPrice ? formatPrice(delivery.courierPrice) : "бесплатно"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Самовывоз</dt>
                <dd className="font-medium">{delivery.pickup} · бесплатно</dd>
              </div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Гарантия</dt><dd className="font-medium">12 месяцев</dd></div>
            </dl>
          </div>

          {specs.length ? (
            <section className="mt-6">
              <h2 className="font-semibold">Характеристики</h2>
              <dl className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface text-sm">
                {specs.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-2 gap-4 px-4 py-2.5">
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <p className="mt-6 text-sm leading-relaxed text-muted">{product.description}</p>
        </div>
      </div>

      <Suspense fallback={<div className="mt-14 h-48 animate-pulse rounded-3xl bg-surface-2/50" />}>
        <ProductReviews productId={product.id} slug={product.slug} />
      </Suspense>

      <Suspense fallback={null}>
        <Similar id={product.id} categoryId={product.categoryId} price={product.price} />
      </Suspense>
    </>
  );
}

async function Similar({ id, categoryId, price }: { id: string; categoryId: string; price: number }) {
  const [items, favs, cartIds] = await Promise.all([getSimilar(id, categoryId, price), getFavoriteIds(), getCartIds()]);
  if (!items.length) return null;
  return (
    <section className="mt-14">
      <h2 className="text-xl font-bold">Похожие по цене</h2>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {items.map((p) => (
          <li key={p.id} className="flex">
            <ProductCard p={p} favored={favs.has(p.id)} inCart={cartIds.has(p.id)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
