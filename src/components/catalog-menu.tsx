"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconGrid } from "./icons";
import { buttonVariants } from "./ui/button-variants";

type Cat = { slug: string; name: string; count: number };

/** Кнопка «Каталог» с выпадающим меню категорий, как у крупных магазинов */
export function CatalogMenu({ categories }: { categories: Cat[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // закрываем при переходе на другую страницу
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="catalog-menu"
        onClick={() => setOpen((v) => !v)}
        className={buttonVariants({ className: "font-semibold" })}
      >
        <IconGrid className="size-5" />
        Каталог
      </button>
      {open ? (
        <div id="catalog-menu" className="absolute left-0 top-full z-40 mt-2 w-80 rounded-3xl border border-border bg-surface/95 p-2 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)] backdrop-blur-xl">
          <ul>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/catalog?category=${c.slug}`} className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition-colors hover:bg-violet/15">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-muted">{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/catalog" className="mt-1 block rounded-2xl border-t border-border px-4 py-3 text-sm font-semibold text-lilac hover:bg-violet/15">
            Все товары →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
