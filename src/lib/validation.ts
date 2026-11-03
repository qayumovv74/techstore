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
  .refine((v) => v === "" || /^\+7\d{10}$/.test(v), "Формат: +7 900 123-45-67");

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

/** Красиво показать телефон: +79001234567 → +7 900 123-45-67 */
export function formatPhone(v: string | null | undefined) {
  if (!v) return "";
  const m = v.match(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/);
  return m ? `+7 ${m[1]} ${m[2]}-${m[3]}-${m[4]}` : v;
}
