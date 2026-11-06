"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const items = [
  { href: "/admin", label: "Дашборд" },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/users", label: "Пользователи" },
];

export function AdminNav() {
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
    <nav aria-label="Разделы админки" className="flex gap-2 overflow-x-auto">
      {items.map((it) => {
        const active = it.href === "/admin" ? pathname === "/admin" : pathname.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm ${active ? "bg-lilac font-semibold text-ink shadow-[0_8px_24px_-10px_rgb(196_181_232/0.8)]" : "border border-white/15 bg-ink/40 backdrop-blur hover:bg-surface-2"}`}>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
