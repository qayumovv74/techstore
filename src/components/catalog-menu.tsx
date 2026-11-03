"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconGrid } from "./icons";

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
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover"
      >
        <IconGrid className="size-5" />
        Каталог
      </button>
      {open ? (
        <div id="catalog-menu" className="absolute left-0 top-full z-30 mt-2 w-80 rounded-2xl border border-border bg-surface p-2 shadow-xl">
          <ul>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/catalog?category=${c.slug}`} className="flex items-center justify-between rounded-xl px-4 py-3 text-sm hover:bg-surface-2">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-muted">{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/catalog" className="mt-1 block rounded-xl border-t border-border px-4 py-3 text-sm font-semibold text-primary hover:bg-surface-2">
            Все товары →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
