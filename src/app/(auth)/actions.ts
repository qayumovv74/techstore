"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { createSession, deleteSession } from "@/lib/session";
import { mergeGuestCart } from "@/lib/cart";
import { recordAuthEvent } from "@/lib/audit";
import { hashPassword, needsRehash, verifyPassword } from "@/lib/password";
import { isLoginLocked, LOCK_MINUTES } from "@/lib/login-guard";
import { limitByIp, tooManyMessage } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/email-verification";
import { loginSchema, registerSchema, type FormState } from "@/lib/validation";
import { safeNext } from "@/lib/safe-next";

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = { email: String(formData.get("email") ?? ""), password: String(formData.get("password") ?? "") };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values: { email: raw.email } };
  }
  const values = { email: raw.email };

  const byIp = await limitByIp("login");
  if (!byIp.ok) return { error: tooManyMessage(byIp.retryAfter), values };
  // проверяем до сверки пароля: во время блокировки даже верный пароль не пускает
  if (await isLoginLocked(parsed.data.email)) {
    return {
      error: `Слишком много неудачных попыток. Подождите ${LOCK_MINUTES} минут или восстановите пароль.`,
      values,
    };
  }

  const user = await db.query.users.findFirst({ where: eq(schema.users.email, parsed.data.email) });
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash);
  if (!user || !ok) {
    await recordAuthEvent("LOGIN_FAILED", parsed.data.email, user?.id ?? null);
    return { error: "Неверный email или пароль", values };
  }

  // старый bcrypt-хеш или устаревшие параметры — пересчитываем, пока пароль у нас в руках
  if (needsRehash(user.passwordHash)) {
    await db
      .update(schema.users)
      .set({ passwordHash: await hashPassword(parsed.data.password) })
      .where(eq(schema.users.id, user.id));
  }

  // галочка «Запомнить меня»: без неё сессия живёт до закрытия браузера
  await createSession(
    { userId: user.id, role: user.role, sv: user.sessionVersion },
    { remember: formData.get("remember") === "on" },
  );
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
  const values = { name: raw.name, email: raw.email };
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values };

  const byIp = await limitByIp("register");
  if (!byIp.ok) return { error: tooManyMessage(byIp.retryAfter), values };

  const passwordHash = await hashPassword(parsed.data.password);
  // Роль всегда CUSTOMER: повысить может только админ
  const [user] = await db
    .insert(schema.users)
    .values({ name: parsed.data.name, email: parsed.data.email, passwordHash })
    .onConflictDoNothing({ target: schema.users.email })
    .returning({ id: schema.users.id, role: schema.users.role, sv: schema.users.sessionVersion });

  if (!user) {
    return { fieldErrors: { email: ["Этот email уже зарегистрирован"] }, values };
  }

  await createSession({ userId: user.id, role: user.role, sv: user.sv });
  await mergeGuestCart(user.id);
  await recordAuthEvent("REGISTER", parsed.data.email, user.id);
  // письмо не должно ломать регистрацию: если SMTP недоступен, ссылку можно запросить из кабинета
  await sendVerificationEmail({ id: user.id, name: parsed.data.name, email: parsed.data.email }).catch((e) =>
    console.error("[verify-email]", e),
  );
  redirect(safeNext(formData.get("next"), "/account"));
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
