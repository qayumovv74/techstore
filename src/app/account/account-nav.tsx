"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const items = [
  { href: "/account", label: "Обзор" },
  { href: "/account/orders", label: "Мои заказы" },
  { href: "/account/favorites", label: "Избранное" },
  { href: "/account/addresses", label: "Адреса доставки" },
  { href: "/account/profile", label: "Профиль и безопасность" },
];

export function AccountNav() {
  return (
    <Suspense fallback={<Nav pathname="" />}>
      <LiveNav />
    </Suspense>
  );
}

function LiveNav() {
  return <Nav pathname={usePathname()} />;
}

function Nav({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Разделы кабинета" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-2 lg:flex-col lg:gap-1">
        {items.map((it) => {
          const active = it.href === "/account" ? pathname === "/account" : pathname.startsWith(it.href);
          return (
            <li key={it.href} className="shrink-0">
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-10 items-center rounded-xl px-4 text-sm transition-colors ${
                  active ? "bg-primary font-semibold text-on-primary" : "hover:bg-surface-2"
                }`}
              >
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
