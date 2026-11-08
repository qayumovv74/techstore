"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { LiquidNavbar, NimbusIcons, type LiquidNavItem } from "./ui/liquid-glass-navbar";

type Props = {
  variant: "desktop" | "mobile";
  userName: string | null;
  avatarUrl?: string | null;
  favCount: number;
  cartCount: number;
  className?: string;
};

type Item = LiquidNavItem & { key: string; match: (p: string) => boolean };

function buildItems({ variant, userName, avatarUrl, favCount, cartCount }: Props): Item[] {
  const all: Item[] = [
    { key: "home", label: "Главная", href: "/", icon: NimbusIcons.home, fx: "glow", match: (p) => p === "/" },
    {
      key: "catalog",
      label: "Каталог",
      href: "/catalog",
      icon: NimbusIcons.grid,
      fx: "spin",
      match: (p) => p.startsWith("/catalog") || p.startsWith("/product"),
    },
    { key: "fav", label: "Избранное", href: "/account/favorites", icon: NimbusIcons.heart, fx: "pop", badge: favCount, match: (p) => p === "/account/favorites" },
    { key: "cart", label: "Корзина", href: "/cart", icon: NimbusIcons.cart, fx: "plane", badge: cartCount, match: (p) => p.startsWith("/cart") || p.startsWith("/checkout") },
    {
      key: "user",
      label: userName ? userName.split(" ")[0] : "Войти",
      href: userName ? "/account" : "/login",
      icon: avatarUrl ? (
        <Image src={avatarUrl} alt="" width={22} height={22} className="size-[22px] rounded-full object-cover ring-1 ring-white/40" />
      ) : (
        NimbusIcons.user
      ),
      fx: "wave",
      match: (p) =>
        (p.startsWith("/account") && p !== "/account/favorites") || p === "/login" || p === "/register" || p.endsWith("-password"),
    },
  ];
  // на компьютере у каталога своя кнопка с категориями рядом с логотипом
  return variant === "desktop" ? all.filter((i) => i.key !== "catalog") : all;
}

/** Главная навигация магазина: «жидкая» пилюля в шапке и внизу экрана на телефоне */
export function MainNav(props: Props) {
  return (
    <Suspense fallback={<Bar {...props} pathname={null} />}>
      <LiveBar {...props} />
    </Suspense>
  );
}

function LiveBar(props: Props) {
  return <Bar {...props} pathname={usePathname()} />;
}

function Bar({ pathname, className, ...props }: Props & { pathname: string | null }) {
  const items = buildItems(props);
  const fromPath = pathname === null ? -1 : items.findIndex((i) => i.match(pathname));
  // капля перетекает сразу по клику, не дожидаясь, пока загрузится страница
  const [pending, setPending] = useState<{ index: number; from: string | null } | null>(null);
  const active = pending && pending.from === pathname ? pending.index : fromPath;

  return (
    <LiquidNavbar
      items={items}
      active={active}
      onChange={(index) => setPending({ index, from: pathname })}
      tone="dark"
      compact={props.variant === "mobile"}
      ariaLabel={props.variant === "mobile" ? "Основная навигация" : "Разделы"}
      className={className}
    />
  );
}
