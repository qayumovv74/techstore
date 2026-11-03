"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, count, eq, gt, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { createSession } from "@/lib/session";
import { forgotSchema, resetSchema, type ActionState } from "@/lib/validation";

const TTL_MIN = 30;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export type ForgotState = ActionState & { devLink?: string };

export async function requestReset(_: ForgotState, fd: FormData): Promise<ForgotState> {
  const parsed = forgotSchema.safeParse({ email: String(fd.get("email") ?? "") });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values: { email: String(fd.get("email") ?? "") } };

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

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const link = `${origin}/reset-password?token=${token}`;

  // TODO: отправка письма (Resend / SMTP) при деплое. Пока почты нет — в разработке показываем ссылку.
  console.log(`[reset] ${user.email}: ${link}`);
  return process.env.NODE_ENV === "production" ? done : { ...done, devLink: link };
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
    const [u] = await tx
      .update(schema.users)
      .set({ passwordHash: await bcrypt.hash(parsed.data.next, 10) })
      .where(eq(schema.users.id, reset.userId))
      .returning({ id: schema.users.id, role: schema.users.role });
    // гасим все ссылки этого пользователя, не только текущую
    await tx
      .update(schema.passwordResets)
      .set({ usedAt: new Date() })
      .where(and(eq(schema.passwordResets.userId, reset.userId), isNull(schema.passwordResets.usedAt)));
    return u;
  });

  await createSession({ userId: user.id, role: user.role });
  redirect("/account?reset=1");
}
