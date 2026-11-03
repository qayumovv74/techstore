"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Card, Field } from "@/components/ui";
import type { ActionState } from "@/lib/validation";
import { resetPassword } from "../reset-actions";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(resetPassword, {});
  const fe = state.fieldErrors ?? {};
  return (
    <Card className="w-full max-w-md">
      <h1 className="text-2xl font-bold">Новый пароль</h1>
      <p className="mt-1 text-sm text-muted">Минимум 8 символов, буквы и цифры. После сохранения вы сразу войдёте.</p>
      <form action={action} className="mt-6 flex flex-col gap-4" noValidate>
        <input type="hidden" name="token" value={token} />
        <Field label="Новый пароль" name="next" type="password" autoComplete="new-password" errors={fe.next} />
        <Field label="Повторите пароль" name="confirm" type="password" autoComplete="new-password" errors={fe.confirm} />
        {state.error ? (
          <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            {state.error} <Link href="/forgot-password" className="font-semibold underline">Запросить снова</Link>
          </p>
        ) : null}
        <Button disabled={pending}>{pending ? "Сохраняем…" : "Сохранить и войти"}</Button>
      </form>
    </Card>
  );
}
