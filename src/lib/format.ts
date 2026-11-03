const rub = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

/** Цены храним в копейках: 12999000 → «129 990 ₽» */
export const formatPrice = (kopecks: number) => rub.format(kopecks / 100);

export const roleLabel = { CUSTOMER: "Покупатель", MANAGER: "Менеджер", ADMIN: "Админ" } as const;
