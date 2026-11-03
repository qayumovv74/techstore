import Link from "next/link";
import { Logo } from "./logo";

const cols = [
  {
    title: "Покупателям",
    links: [
      ["Каталог", "/catalog"],
      ["Смартфоны", "/catalog?category=smartphones"],
      ["Ноутбуки", "/catalog?category=laptops"],
      ["Аудио", "/catalog?category=audio"],
    ],
  },
  {
    title: "Личный кабинет",
    links: [
      ["Мои заказы", "/account/orders"],
      ["Избранное", "/account/favorites"],
      ["Адреса доставки", "/account/addresses"],
      ["Профиль", "/account/profile"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo className="h-8" />
          <p className="mt-4 max-w-sm text-sm text-muted">Техника, гаджеты и аксессуары с официальной гарантией. Доставка по Москве на следующий день.</p>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <p className="text-sm font-semibold">{c.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {c.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-primary">{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="border-t border-border py-5 text-center text-xs text-muted">© TechStore · учебный проект для портфолио, не настоящий магазин</p>
    </footer>
  );
}
