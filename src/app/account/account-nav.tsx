"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Heart, LayoutDashboard, LifeBuoy, MapPin, Package, UserRound } from "lucide-react";

const items = [
  { href: "/account", label: "Обзор", icon: LayoutDashboard },
  { href: "/account/orders", label: "Мои заказы", icon: Package },
  { href: "/account/favorites", label: "Избранное", icon: Heart },
  { href: "/account/addresses", label: "Адреса доставки", icon: MapPin },
  { href: "/account/profile", label: "Профиль и безопасность", icon: UserRound },
  { href: "/support", label: "Поддержка", icon: LifeBuoy },
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
                className={`flex h-10 items-center gap-2.5 rounded-xl px-4 text-sm transition-colors ${
                  active ? "bg-lilac font-semibold text-ink" : "bg-ink/40 backdrop-blur hover:bg-surface-2"
                }`}
              >
                <it.icon className="size-4 shrink-0" aria-hidden />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
