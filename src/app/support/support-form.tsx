"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { Button, Field, GlassInput } from "@/components/ui";
import { SUPPORT_TOPICS } from "@/lib/validation";
import { sendSupportMessage, type SupportState } from "./actions";
import { cn } from "@/lib/cn";

export function SupportForm({ name, email, order, topic }: { name?: string; email?: string; order?: string; topic?: string }) {
  const [state, action, pending] = useActionState<SupportState, FormData>(sendSupportMessage, {});
  const fe = state.fieldErrors ?? {};
  const v = state.values ?? {};

  if (state.ok) {
    return (
      <div role="status" className="flex flex-col items-start gap-4">
        <CheckCircle2 className="size-10 text-lilac" aria-hidden />
        <div>
          <h2 className="text-xl font-bold">Обращение №{state.ticket} принято</h2>
          <p className="mt-2 text-sm text-muted">
            Ответим на вашу почту в течение рабочего дня. Копию сообщения мы уже отправили вам на email.
          </p>
        </div>
        <Link href="/" className="text-sm font-semibold text-lilac hover:text-white">На главную →</Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Имя" name="name" autoComplete="name" defaultValue={v.name ?? name} errors={fe.name} />
        <Field label="Email для ответа" name="email" type="email" autoComplete="email" defaultValue={v.email ?? email} errors={fe.email} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted">Тема</span>
          <GlassInput>
            <select name="topic" defaultValue={v.topic ?? topic ?? "ORDER"} className="h-12 w-full rounded-2xl bg-transparent px-4 text-base outline-none">
              {Object.entries(SUPPORT_TOPICS).map(([k, label]) => (
                <option key={k} value={k} className="bg-surface">{label}</option>
              ))}
            </select>
          </GlassInput>
        </label>
        <Field label="Номер заказа (если есть)" name="orderNumber" placeholder="TS-1001" defaultValue={v.orderNumber ?? order} errors={fe.orderNumber} />
      </div>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-muted">Что случилось?</span>
        <textarea
          name="message"
          rows={6}
          defaultValue={v.message}
          placeholder="Опишите проблему: что заказали, что пошло не так и как вам будет удобнее решить вопрос"
          className={cn(
            "rounded-2xl border bg-text/5 px-4 py-3 text-base outline-none backdrop-blur-sm transition-colors placeholder:text-muted/60 focus:border-violet/70 focus:bg-violet/10",
            fe.message ? "border-danger" : "border-border",
          )}
        />
        {fe.message ? <span className="text-danger">{fe.message[0]}</span> : null}
      </label>
      {state.error ? <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</p> : null}
      <Button loading={pending} leftIcon={<Mail aria-hidden />} leftIconMotion="mail" className="h-12 w-full rounded-2xl sm:w-fit sm:px-8">
        {pending ? "Отправляем…" : "Отправить в поддержку"}
      </Button>
    </form>
  );
}
