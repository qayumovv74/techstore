"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Mail } from "lucide-react";
import { Button, Field } from "@/components/ui";
import { requestReset, type ForgotState } from "../reset-actions";

export function ForgotForm() {
  const [state, action, pending] = useActionState<ForgotState, FormData>(requestReset, {});

  return (
    <div className="flex flex-col gap-6">
      <h1 className="animate-element animate-delay-100 text-4xl font-semibold leading-tight">
        <span className="font-light tracking-tighter">Восстановление пароля</span>
      </h1>
      {state.ok ? (
        <div className="animate-element space-y-4 text-sm">
          <p>{state.message}</p>
          {state.devLink ? (
            <div className="rounded-2xl border border-dashed border-violet/60 bg-violet/10 p-4">
              <p className="text-xs text-muted">
                Режим разработки: SMTP не настроен, письмо ушло в тестовый ящик.
                {state.previewUrl ? (
                  <>
                    {" "}
                    <a href={state.previewUrl} target="_blank" rel="noreferrer" className="underline">Посмотреть письмо</a>
                  </>
                ) : null}
              </p>
              <Link href={state.devLink} className="mt-1 block break-all font-semibold text-lilac hover:underline">
                Задать новый пароль →
              </Link>
            </div>
          ) : null}
          <Link href="/login" className="inline-block font-semibold text-lilac hover:underline">Вернуться ко входу</Link>
        </div>
      ) : (
        <>
          <p className="animate-element animate-delay-200 text-muted">
            Укажите email, на который зарегистрирован аккаунт. Пришлём ссылку для смены пароля.
          </p>
          <form action={action} className="flex flex-col gap-5" noValidate>
            <div className="animate-element animate-delay-300">
              <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.ru" defaultValue={state.values?.email} errors={state.fieldErrors?.email} />
            </div>
            <div className="animate-element animate-delay-400">
              <Button loading={pending} leftIcon={<Mail aria-hidden />} leftIconMotion="mail" className="h-12 w-full rounded-2xl">
                {pending ? "Отправляем…" : "Получить ссылку"}
              </Button>
            </div>
          </form>
          <p className="animate-element animate-delay-500 text-center text-sm text-muted">
            Вспомнили? <Link href="/login" className="font-semibold text-lilac hover:underline">Войти</Link>
          </p>
        </>
      )}
    </div>
  );
}
