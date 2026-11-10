"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MailWarning } from "lucide-react";
import { Button } from "@/components/ui";
import { resendVerification, type VerifyState } from "@/app/(auth)/verify-actions";

/** Плашка «Подтвердите почту» с кнопкой повторной отправки. reason — что даст подтверждение. */
export function VerifyEmailNotice({ email, reason = "Без этого нельзя оформить заказ." }: { email: string; reason?: string }) {
  const [state, action, pending] = useActionState<VerifyState, FormData>(resendVerification, {});

  return (
    <section aria-label="Подтверждение почты" className="flex flex-col gap-3 rounded-3xl border border-violet/40 bg-violet/10 p-5 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <MailWarning className="mt-0.5 size-5 shrink-0 text-lilac" aria-hidden />
        <div className="text-sm">
          <p className="font-semibold text-text">Подтвердите почту</p>
          <p className="mt-1 text-muted">
            Мы отправили ссылку на <span className="text-text">{email}</span>. {reason}
          </p>
        </div>
      </div>
      {state.message ? <p role="status" className="text-sm text-lilac">{state.message}</p> : null}
      {state.error ? <p role="alert" className="text-sm text-danger">{state.error}</p> : null}
      {state.devLink ? (
        <div className="rounded-2xl border border-dashed border-violet/60 p-3 text-xs text-muted">
          Режим разработки: SMTP не настроен.{" "}
          {state.previewUrl ? (
            <a href={state.previewUrl} target="_blank" rel="noreferrer" className="underline">Письмо</a>
          ) : null}
          <Link href={state.devLink} className="mt-1 block break-all font-semibold text-lilac hover:underline">
            Подтвердить почту →
          </Link>
        </div>
      ) : null}
      <form action={action}>
        <Button type="submit" variant="outline" size="sm" loading={pending}>
          {pending ? "Отправляем…" : "Отправить письмо ещё раз"}
        </Button>
      </form>
    </section>
  );
}
