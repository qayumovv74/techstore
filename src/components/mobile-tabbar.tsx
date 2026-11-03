"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { IconCart, IconGrid, IconHeart, IconHome, IconUser } from "./icons";

const tabs = [
  { href: "/", label: "Главная", Icon: IconHome, match: (p: string) => p === "/" },
  { href: "/catalog", label: "Каталог", Icon: IconGrid, match: (p: string) => p.startsWith("/catalog") || p.startsWith("/product") },
  { href: "/account/favorites", label: "Избранное", Icon: IconHeart, match: (p: string) => p === "/account/favorites" },
  { href: "/cart", label: "Корзина", Icon: IconCart, match: (p: string) => p.startsWith("/cart") },
  { href: "/account", label: "Профиль", Icon: IconUser, match: (p: string) => p === "/account" || (p.startsWith("/account/") && p !== "/account/favorites") || p === "/login" },
];

/** Нижняя панель навигации на телефоне — как в приложениях магазинов */
export function MobileTabbar() {
  // usePathname читает URL на запросе — поэтому за Suspense, а в статике панель без подсветки
  return (
    <Suspense fallback={<Bar pathname="" />}>
      <LiveBar />
    </Suspense>
  );
}

function LiveBar() {
  return <Bar pathname={usePathname()} />;
}

function Bar({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Основная навигация" className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {tabs.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined}
                className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] ${active ? "text-primary" : "text-muted"}`}>
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
