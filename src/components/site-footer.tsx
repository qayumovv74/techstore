import HalftoneWordmarkFooter, { type FooterColumn } from "./ui/halftone-wordmark-footer";

const columns: FooterColumn[] = [
  {
    title: "Покупателям",
    links: [
      { label: "Каталог", href: "/catalog" },
      { label: "Доставка", href: "/delivery" },
      { label: "Рассрочка", href: "/installment" },
      { label: "Контакты", href: "/contacts" },
      { label: "Поддержка", href: "/support" },
      { label: "Авторы фото", href: "/photo-credits" },
    ],
  },
  {
    title: "Личный кабинет",
    links: [
      { label: "Мои заказы", href: "/account/orders" },
      { label: "Избранное", href: "/account/favorites" },
      { label: "Адреса доставки", href: "/account/addresses" },
      { label: "Профиль", href: "/account/profile" },
    ],
  },
  {
    title: "Режим работы",
    links: [
      { label: "Магазин — круглосуточно", href: "/contacts" },
      { label: "Поддержка 9:00–21:00", href: "/contacts" },
      { label: "Выдача 10:00–22:00", href: "/contacts" },
    ],
  },
];

export function SiteFooter() {
  return (
    <HalftoneWordmarkFooter
      wordmark="techstore"
      label="TechStore"
      meta="© 2026 · Москва"
      description="Техника, гаджеты и аксессуары с официальной гарантией. Доставка по Москве на следующий день."
      columns={columns}
      className="mt-20 border-t border-white/5 bg-linear-to-b from-ink/30 to-ink/90 pb-[19vw] md:pb-[17vw]"
    />
  );
}
