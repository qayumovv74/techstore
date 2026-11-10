"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui";
import type { ActionState } from "@/lib/validation";
import { confirmEmailAction } from "../verify-actions";

export function ConfirmForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(confirmEmailAction, {});

  return (
    <div className="flex flex-col gap-6">
      <h1 className="animate-element animate-delay-100 text-4xl font-semibold leading-tight">
        <span className="font-light tracking-tighter">Подтверждение почты</span>
      </h1>
      <p className="animate-element animate-delay-200 text-muted">
        Остался один шаг: нажмите кнопку, и можно оформлять заказы.
      </p>
      <form action={action} className="animate-element animate-delay-300 flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        {state.error ? (
          <p role="alert" className="rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {state.error}
          </p>
        ) : null}
        <Button loading={pending} leftIcon={<MailCheck aria-hidden />} className="h-12 w-full rounded-2xl">
          {pending ? "Проверяем…" : "Подтвердить почту"}
        </Button>
      </form>
      <p className="animate-element animate-delay-400 text-center text-sm text-muted">
        <Link href="/account" className="font-semibold text-lilac hover:underline">В личный кабинет</Link>
      </p>
    </div>
  );
}
