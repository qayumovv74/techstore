import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Введите корректный email").trim().toLowerCase(),
  password: z.string().min(1, "Введите пароль"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Минимум 2 символа").max(60),
  email: z.email("Введите корректный email").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Минимум 8 символов")
    .regex(/[a-zA-Zа-яА-Я]/, "Нужна хотя бы одна буква")
    .regex(/[0-9]/, "Нужна хотя бы одна цифра"),
});

export type FormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  values?: Record<string, string>;
};

/** Российский мобильный: +7 и 10 цифр, принимаем любые пробелы/скобки/дефисы */
const ruPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[^\d+]/g, "").replace(/^8(?=\d{10}$)/, "+7"))
  .transform((v) => (v === "+7" || v === "+" ? "" : v))
  .refine((v) => v === "" || /^\+7\d{10}$/.test(v), "Номер из 10 цифр после +7");

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Минимум 2 символа").max(60),
  phone: ruPhone,
});

export const passwordSchema = z
  .object({
    current: z.string().min(1, "Введите текущий пароль"),
    next: registerSchema.shape.password,
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, { path: ["confirm"], message: "Пароли не совпадают" });

export const addressSchema = z.object({
  label: z.string().trim().min(1, "Например: Дом").max(30),
  city: z.string().trim().min(2, "Укажите город").max(60),
  street: z.string().trim().min(3, "Улица и дом").max(120),
  apartment: z.string().trim().max(20).optional(),
  comment: z.string().trim().max(200).optional(),
  isDefault: z.boolean(),
});

/** nonce меняется после успешной отправки — форма сбрасывается через key */
export type ActionState = FormState & { ok?: boolean; message?: string; nonce?: number };

/** +79001234567 → +7 (900) 123-45-67 */
export function formatPhone(v: string | null | undefined) {
  if (!v) return "";
  const m = v.match(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/);
  return m ? `+7 (${m[1]}) ${m[2]}-${m[3]}-${m[4]}` : v;
}

export const forgotSchema = z.object({ email: z.email("Введите корректный email").trim().toLowerCase() });

export const resetSchema = z
  .object({ token: z.string().min(20), next: registerSchema.shape.password, confirm: z.string() })
  .refine((d) => d.next === d.confirm, { path: ["confirm"], message: "Пароли не совпадают" });

export const reviewSchema = z.object({
  productId: z.uuid(),
  rating: z.coerce.number().int().min(1, "Поставьте оценку от 1 до 5").max(5, "Поставьте оценку от 1 до 5"),
  text: z.string().trim().min(10, "Напишите хотя бы пару предложений — от 10 символов").max(1500, "Слишком длинно — до 1500 символов"),
});

export const SUPPORT_TOPICS = {
  ORDER: "Заказ",
  DELIVERY: "Доставка",
  RETURN: "Возврат и гарантия",
  PAYMENT: "Оплата",
  SITE: "Ошибка на сайте",
  OTHER: "Другое",
} as const;

export const supportSchema = z.object({
  name: z.string().trim().min(2, "Как к вам обращаться?").max(80),
  email: z.email("Введите корректный email").trim().toLowerCase(),
  topic: z.enum(Object.keys(SUPPORT_TOPICS) as [keyof typeof SUPPORT_TOPICS, ...(keyof typeof SUPPORT_TOPICS)[]]),
  orderNumber: z
    .string()
    .trim()
    .max(20)
    .transform((v) => v.replace(/^ts-?/i, "").replace(/\D/g, ""))
    .optional(),
  message: z.string().trim().min(10, "Опишите ситуацию подробнее — от 10 символов").max(3000, "До 3000 символов"),
});
