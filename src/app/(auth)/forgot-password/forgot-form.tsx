"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Card, Field } from "@/components/ui";
import { requestReset, type ForgotState } from "../reset-actions";

export function ForgotForm() {
  const [state, action, pending] = useActionState<ForgotState, FormData>(requestReset, {});

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-2xl font-bold">Восстановление пароля</h1>
      {state.ok ? (
        <div className="mt-4 space-y-4 text-sm">
          <p>{state.message}</p>
          {state.devLink ? (
            <div className="rounded-xl border border-dashed border-primary p-3">
              <p className="text-xs text-muted">Режим разработки: почта не подключена, поэтому ссылка здесь.</p>
              <Link href={state.devLink} className="mt-1 block break-all font-semibold text-primary hover:text-primary-hover">
                Задать новый пароль →
              </Link>
            </div>
          ) : null}
          <Link href="/login" className="inline-block font-semibold text-primary hover:text-primary-hover">Вернуться ко входу</Link>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted">Укажите email, на который зарегистрирован аккаунт. Пришлём ссылку для смены пароля.</p>
          <form action={action} className="mt-6 flex flex-col gap-4" noValidate>
            <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} errors={state.fieldErrors?.email} />
            <Button disabled={pending}>{pending ? "Отправляем…" : "Получить ссылку"}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted">
            Вспомнили? <Link href="/login" className="font-semibold text-primary hover:text-primary-hover">Войти</Link>
          </p>
        </>
      )}
    </Card>
  );
}
