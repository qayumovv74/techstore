"use server";

import { answer, type AssistantReply } from "@/lib/assistant";
import { limitByIp } from "@/lib/rate-limit";

export async function askAssistant(message: string): Promise<AssistantReply> {
  const text = String(message ?? "").slice(0, 500);
  // каждый вопрос — запросы к каталогу в базе; без лимита это удобная кнопка для нагрузки
  if (!(await limitByIp("assistant")).ok) {
    return { text: "Вы задаёте вопросы слишком часто — подождите минуту, и продолжим." };
  }
  try {
    return await answer(text);
  } catch (e) {
    console.error("[assistant]", e);
    return { text: "Что-то пошло не так, попробуйте ещё раз чуть позже.", links: [{ label: "Написать в поддержку", href: "/support" }] };
  }
}
