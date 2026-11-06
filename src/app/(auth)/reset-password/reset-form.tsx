"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui";
import { PasswordField } from "@/components/password-field";
import type { ActionState } from "@/lib/validation";
import { resetPassword } from "../reset-actions";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(resetPassword, {});
  const fe = state.fieldErrors ?? {};
  return (
    <div className="flex flex-col gap-6">
      <h1 className="animate-element animate-delay-100 text-4xl font-semibold leading-tight">
        <span className="font-light tracking-tighter">Новый пароль</span>
      </h1>
      <p className="animate-element animate-delay-200 text-muted">Минимум 8 символов, буквы и цифры. После сохранения вы сразу войдёте.</p>
      <form action={action} className="flex flex-col gap-5" noValidate>
        <input type="hidden" name="token" value={token} />
        <div className="animate-element animate-delay-300">
          <PasswordField label="Новый пароль" name="next" autoComplete="new-password" errors={fe.next} />
        </div>
        <div className="animate-element animate-delay-400">
          <PasswordField label="Повторите пароль" name="confirm" autoComplete="new-password" errors={fe.confirm} />
        </div>
        {state.error ? (
          <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
            {state.error} <Link href="/forgot-password" className="font-semibold underline">Запросить снова</Link>
          </p>
        ) : null}
        <div className="animate-element animate-delay-500">
          <Button loading={pending} className="h-12 w-full rounded-2xl">{pending ? "Сохраняем…" : "Сохранить и войти"}</Button>
        </div>
      </form>
    </div>
  );
}
