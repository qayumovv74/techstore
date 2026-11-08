"use server";

import { and, count, eq, gt, or } from "drizzle-orm";
import { headers } from "next/headers";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { clientIp } from "@/lib/audit";
import { sendMail } from "@/lib/mail";
import { supportReceivedMail, supportTeamMail } from "@/lib/mail/templates";
import { SUPPORT_NAME, supportInbox, supportPublicEmail } from "@/lib/support";
import { SUPPORT_TOPICS, supportSchema, type ActionState } from "@/lib/validation";

export type SupportState = ActionState & { ticket?: number };

export async function sendSupportMessage(_: SupportState, fd: FormData): Promise<SupportState> {
  const raw = {
    name: String(fd.get("name") ?? ""),
    email: String(fd.get("email") ?? ""),
    topic: String(fd.get("topic") ?? "OTHER"),
    orderNumber: String(fd.get("orderNumber") ?? ""),
    message: String(fd.get("message") ?? ""),
  };
  const parsed = supportSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values: raw };

  const user = await getCurrentUser();
  const ip = clientIp(await headers());

  // не больше 3 обращений за 10 минут с одной почты или одного IP — защита от спама
  const since = new Date(Date.now() - 10 * 60_000);
  const [{ n }] = await db
    .select({ n: count() })
    .from(schema.supportTickets)
    .where(
      and(
        gt(schema.supportTickets.createdAt, since),
        ip ? or(eq(schema.supportTickets.email, parsed.data.email), eq(schema.supportTickets.ip, ip)) : eq(schema.supportTickets.email, parsed.data.email),
      ),
    );
  if (n >= 3) return { error: "Вы уже отправили несколько сообщений. Мы ответим на них — новое можно отправить через 10 минут.", values: raw };

  const [ticket] = await db
    .insert(schema.supportTickets)
    .values({
      userId: user?.id ?? null,
      name: parsed.data.name,
      email: parsed.data.email,
      topic: parsed.data.topic,
      orderNumber: parsed.data.orderNumber || null,
      message: parsed.data.message,
      ip,
    })
    .returning({ number: schema.supportTickets.number });

  const mailData = { ...parsed.data, topic: SUPPORT_TOPICS[parsed.data.topic], number: ticket.number, userId: user?.id };

  // команде — на личную почту из .env; «Ответить» в письме сразу пишет клиенту
  const inbox = supportInbox();
  if (inbox) {
    const m = supportTeamMail(mailData);
    await sendMail(inbox, m.subject, m.html, m.text, { replyTo: `${parsed.data.name} <${parsed.data.email}>`, fromName: "TechStore · сайт" });
  } else {
    console.warn("[support] SUPPORT_INBOX не задан — обращение сохранено только в базе");
  }

  // клиенту — подтверждение от имени поддержки
  const r = supportReceivedMail(mailData);
  await sendMail(parsed.data.email, r.subject, r.html, r.text, {
    fromName: SUPPORT_NAME,
    replyTo: supportPublicEmail() ?? inbox ?? undefined,
  });

  return { ok: true, ticket: ticket.number, message: "Сообщение отправлено" };
}
