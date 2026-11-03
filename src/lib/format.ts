const rub = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

/** Цены храним в копейках: 12999000 → «129 990 ₽» */
export const formatPrice = (kopecks: number) => rub.format(kopecks / 100);

/** Платёж в месяц при рассрочке 0-0-12, в рублях с округлением вверх */
export const installment = (kopecks: number, months = 12) =>
  Math.ceil(kopecks / 100 / months).toLocaleString("ru-RU");

export const roleLabel = { CUSTOMER: "Покупатель", MANAGER: "Менеджер", ADMIN: "Админ" } as const;

export const pluralize = (n: number, [one, few, many]: [string, string, string]) => {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? few : many;
};

export const statusLabel = {
  PENDING_PAYMENT: "Ожидает оплаты",
  PAID: "Оплачен",
  ASSEMBLING: "Собирается",
  SHIPPING: "В доставке",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
} as const;
