/**
 * Подтверждение почты: письмо со ссылкой после регистрации.
 * Без подтверждения можно войти и смотреть кабинет, но не оформить заказ —
 * так в базу не попадают заказы на чужие и выдуманные адреса.
 * Как и при сбросе пароля, в базе лежит только sha256 от токена.
 */
import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, count, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { appUrl, mailIsReal, sendMail } from "@/lib/mail";
import { verifyEmailMail } from "@/lib/mail/templates";
import { recordAuthEvent } from "@/lib/audit";

const TTL_HOURS = 24;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export type VerificationResult = { sent: boolean; devLink?: string; previewUrl?: string };

export async function sendVerificationEmail(user: { id: string; name: string; email: string }): Promise<VerificationResult> {
  // не больше 3 писем за 15 минут на один аккаунт
  const since = new Date(Date.now() - 15 * 60_000);
  const [{ n }] = await db
    .select({ n: count() })
    .from(schema.emailVerifications)
    .where(and(eq(schema.emailVerifications.userId, user.id), gt(schema.emailVerifications.createdAt, since)));
  if (n >= 3) return { sent: false };

  const token = randomBytes(32).toString("base64url");
  await db.insert(schema.emailVerifications).values({
    userId: user.id,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + TTL_HOURS * 3_600_000),
  });

  const link = `${appUrl()}/verify-email?token=${token}`;
  const mail = verifyEmailMail(user.name, link, TTL_HOURS);
  const sent = await sendMail(user.email, mail.subject, mail.html, mail.text);

  // пока SMTP не настроен, в разработке ссылку показываем прямо на странице
  if (!mailIsReal() && process.env.NODE_ENV !== "production") {
    return { sent: true, devLink: link, previewUrl: sent.previewUrl };
  }
  return { sent: true };
}

/** true — почта подтверждена (или уже была подтверждена этой ссылкой раньше) */
export async function confirmEmail(token: string) {
  const row = await db.query.emailVerifications.findFirst({
    where: and(
      eq(schema.emailVerifications.tokenHash, sha256(token)),
      isNull(schema.emailVerifications.usedAt),
      gt(schema.emailVerifications.expiresAt, new Date()),
    ),
  });
  if (!row) return false;

  const user = await db.transaction(async (tx) => {
    const [u] = await tx
      .update(schema.users)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(schema.users.id, row.userId))
      .returning({ id: schema.users.id, email: schema.users.email });
    await tx
      .update(schema.emailVerifications)
      .set({ usedAt: new Date() })
      .where(and(eq(schema.emailVerifications.userId, row.userId), isNull(schema.emailVerifications.usedAt)));
    return u;
  });
  await recordAuthEvent("EMAIL_VERIFIED", user.email, user.id);
  return true;
}
