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
