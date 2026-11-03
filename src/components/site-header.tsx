import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser, STAFF_ROLES } from "@/lib/auth";
import { logout } from "@/app/(auth)/actions";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-teal text-sm text-white">
            TS
          </span>
          TechStore
        </Link>
        <nav className="hidden gap-5 text-sm text-muted sm:flex">
          <Link href="/" className="hover:text-text">Каталог</Link>
        </nav>
        <div className="ml-auto">
          {/* Сессия читается на запросе — поэтому за Suspense, остальная шапка статична */}
          <Suspense fallback={<div className="h-9 w-24 animate-pulse rounded-xl bg-surface-2" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Link href="/login" className="inline-flex h-9 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover">
        Войти
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-3 text-sm">
      {STAFF_ROLES.includes(user.role) ? (
        <Link href="/admin" className="font-medium text-primary hover:text-primary-hover">Админка</Link>
      ) : null}
      <Link href="/account" className="hidden font-medium hover:text-primary sm:inline">{user.name}</Link>
      <form action={logout}>
        <button className="h-9 rounded-xl border border-border px-3 hover:bg-surface-2">Выйти</button>
      </form>
    </div>
  );
}
