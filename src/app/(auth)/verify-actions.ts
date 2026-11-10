"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { confirmEmail, sendVerificationEmail } from "@/lib/email-verification";
import { limitByIp, tooManyMessage } from "@/lib/rate-limit";
import type { ActionState } from "@/lib/validation";

export type VerifyState = ActionState & { devLink?: string; previewUrl?: string };

export async function resendVerification(): Promise<VerifyState> {
  const user = await requireUser("/account");
  if (user.emailVerified) return { ok: true, message: "Почта уже подтверждена" };

  const byIp = await limitByIp("verifyEmail");
  if (!byIp.ok) return { error: tooManyMessage(byIp.retryAfter) };

  const r = await sendVerificationEmail(user);
  if (!r.sent) {
    return { error: "Письмо недавно уже отправляли. Проверьте почту, в том числе папку «Спам», или попробуйте через 15 минут." };
  }
  return { ok: true, message: `Отправили письмо на ${user.email}`, devLink: r.devLink, previewUrl: r.previewUrl };
}

/**
 * Подтверждение — по кнопке, а не при открытии ссылки:
 * почтовые сервисы и антивирусы сами открывают ссылки из писем и подтвердили бы адрес без человека.
 */
export async function confirmEmailAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const byIp = await limitByIp("verifyEmail");
  if (!byIp.ok) return { error: tooManyMessage(byIp.retryAfter) };

  if (!(await confirmEmail(String(fd.get("token") ?? "")))) {
    return { error: "Ссылка устарела или уже использована. Новую можно запросить в личном кабинете." };
  }
  revalidatePath("/", "layout");
  redirect((await getCurrentUser()) ? "/account?verified=1" : "/login?verified=1");
}
