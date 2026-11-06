"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { createSession, deleteSession } from "@/lib/session";
import { mergeGuestCart } from "@/lib/cart";
import { recordAuthEvent } from "@/lib/audit";
import { loginSchema, registerSchema, type FormState } from "@/lib/validation";
import { safeNext } from "@/lib/safe-next";

// Хеш-заглушка: проверка пароля идёт одинаково долго, есть пользователь или нет.
// Так по времени ответа нельзя узнать, зарегистрирован ли email.
const DUMMY_HASH = "$2b$10$9vFV/0thObD8FxTolZfYUe0YpR2Ou8VJNvI1rhlJMTKDNiSsX7squ";


export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = { email: String(formData.get("email") ?? ""), password: String(formData.get("password") ?? "") };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values: { email: raw.email } };
  }

  const user = await db.query.users.findFirst({ where: eq(schema.users.email, parsed.data.email) });
  const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    await recordAuthEvent("LOGIN_FAILED", parsed.data.email, user?.id ?? null);
    return { error: "Неверный email или пароль", values: { email: raw.email } };
  }

  // галочка «Запомнить меня»: без неё сессия живёт до закрытия браузера
  await createSession({ userId: user.id, role: user.role }, { remember: formData.get("remember") === "on" });
  await mergeGuestCart(user.id);
  await recordAuthEvent("LOGIN", user.email, user.id);
  const fallback = user.role === "CUSTOMER" ? "/account" : "/admin";
  redirect(safeNext(formData.get("next"), fallback));
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values: { name: raw.name, email: raw.email } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  // Роль всегда CUSTOMER: повысить может только админ
  const [user] = await db
    .insert(schema.users)
    .values({ name: parsed.data.name, email: parsed.data.email, passwordHash })
    .onConflictDoNothing({ target: schema.users.email })
    .returning({ id: schema.users.id, role: schema.users.role });

  if (!user) {
    return { fieldErrors: { email: ["Этот email уже зарегистрирован"] }, values: { name: raw.name, email: raw.email } };
  }

  await createSession({ userId: user.id, role: user.role });
  await mergeGuestCart(user.id);
  await recordAuthEvent("REGISTER", parsed.data.email, user.id);
  redirect(safeNext(formData.get("next"), "/account"));
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
