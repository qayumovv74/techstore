const sum = new Intl.NumberFormat("ru-RU");

/** 16900000 → «16 900 000 сум» */
export const formatPrice = (value: number) => `${sum.format(value)} сум`;

export const roleLabel = { CUSTOMER: "Покупатель", MANAGER: "Менеджер", ADMIN: "Админ" } as const;
