"use server";

import { createHash, randomBytes } from "node:crypto";
import { and, count, eq, gt, isNull, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { createSession } from "@/lib/session";
import { appUrl, mailIsReal, sendMail } from "@/lib/mail";
import { resetPasswordMail } from "@/lib/mail/templates";
import { recordAuthEvent } from "@/lib/audit";
import { hashPassword } from "@/lib/password";
import { limitByIp, tooManyMessage } from "@/lib/rate-limit";
import { forgotSchema, resetSchema, type ActionState } from "@/lib/validation";

const TTL_MIN = 30;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export type ForgotState = ActionState & { devLink?: string; previewUrl?: string };

export async function requestReset(_: ForgotState, fd: FormData): Promise<ForgotState> {
  const parsed = forgotSchema.safeParse({ email: String(fd.get("email") ?? "") });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values: { email: String(fd.get("email") ?? "") } };
  const byIp = await limitByIp("forgot");
  if (!byIp.ok) return { error: tooManyMessage(byIp.retryAfter), values: { email: parsed.data.email } };

  // Ответ одинаковый, есть такой email или нет — чтобы нельзя было проверять, кто зарегистрирован
  const done: ForgotState = {
    ok: true,
    message: `Если аккаунт с адресом ${parsed.data.email} существует, мы отправили на него ссылку. Она действует ${TTL_MIN} минут.`,
  };

  const user = await db.query.users.findFirst({ where: eq(schema.users.email, parsed.data.email) });
  if (!user) return done;

  // не больше 3 писем за 15 минут
  const since = new Date(Date.now() - 15 * 60_000);
  const [{ n }] = await db
    .select({ n: count() })
    .from(schema.passwordResets)
    .where(and(eq(schema.passwordResets.userId, user.id), gt(schema.passwordResets.createdAt, since)));
  if (n >= 3) return done;

  const token = randomBytes(32).toString("base64url");
  await db.insert(schema.passwordResets).values({
    userId: user.id,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + TTL_MIN * 60_000),
  });

  const link = `${appUrl()}/reset-password?token=${token}`;
  const mail = resetPasswordMail(user.name, link, TTL_MIN);
  const sent = await sendMail(user.email, mail.subject, mail.html, mail.text);

  // Пока SMTP не настроен, в разработке показываем ссылку и превью письма прямо на странице
  if (!mailIsReal() && process.env.NODE_ENV !== "production") {
    return { ...done, devLink: link, previewUrl: sent.previewUrl };
  }
  return done;
}

export async function resetPassword(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = resetSchema.safeParse({
    token: String(fd.get("token") ?? ""),
    next: String(fd.get("next") ?? ""),
    confirm: String(fd.get("confirm") ?? ""),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const reset = await db.query.passwordResets.findFirst({
    where: and(
      eq(schema.passwordResets.tokenHash, sha256(parsed.data.token)),
      isNull(schema.passwordResets.usedAt),
      gt(schema.passwordResets.expiresAt, new Date()),
    ),
  });
  if (!reset) return { error: "Ссылка устарела или уже использована. Запросите новую." };

  const user = await db.transaction(async (tx) => {
    // новый пароль закрывает все старые сессии; ссылка пришла на почту — значит, адрес подтверждён
    const [u] = await tx
      .update(schema.users)
      .set({
        passwordHash: await hashPassword(parsed.data.next),
        sessionVersion: sql`${schema.users.sessionVersion} + 1`,
        emailVerifiedAt: sql`coalesce(${schema.users.emailVerifiedAt}, now())`,
      })
      .where(eq(schema.users.id, reset.userId))
      .returning({ id: schema.users.id, role: schema.users.role, email: schema.users.email, sv: schema.users.sessionVersion });
    // гасим все ссылки этого пользователя, не только текущую
    await tx
      .update(schema.passwordResets)
      .set({ usedAt: new Date() })
      .where(and(eq(schema.passwordResets.userId, reset.userId), isNull(schema.passwordResets.usedAt)));
    return u;
  });

  await createSession({ userId: user.id, role: user.role, sv: user.sv });
  await recordAuthEvent("PASSWORD_RESET", user.email, user.id);
  redirect("/account?reset=1");
}
