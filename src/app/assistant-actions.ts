"use server";

import { answer, type AssistantReply } from "@/lib/assistant";

export async function askAssistant(message: string): Promise<AssistantReply> {
  const text = String(message ?? "").slice(0, 500);
  try {
    return await answer(text);
  } catch (e) {
    console.error("[assistant]", e);
    return { text: "Что-то пошло не так, попробуйте ещё раз чуть позже.", links: [{ label: "Написать в поддержку", href: "/support" }] };
  }
}
