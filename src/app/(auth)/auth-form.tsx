"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Card, Field } from "@/components/ui";
import { login, register } from "./actions";
import type { FormState } from "@/lib/validation";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    mode === "login" ? login : register,
    {},
  );
  const fe = state.fieldErrors ?? {};

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-2xl font-bold">{mode === "login" ? "Вход" : "Регистрация"}</h1>
      <p className="mt-1 text-sm text-muted">
        {mode === "login" ? "Рады видеть снова" : "Займёт меньше минуты"}
      </p>

      <form action={action} className="mt-6 flex flex-col gap-4" noValidate>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        {mode === "register" ? (
          <Field label="Имя" name="name" autoComplete="name" defaultValue={state.values?.name} errors={fe.name} required />
        ) : null}
        <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} errors={fe.email} required />
        <Field
          label="Пароль"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          errors={fe.password}
          required
        />

        {state.error ? (
          <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="mt-2">
          {pending ? "Подождите…" : mode === "login" ? "Войти" : "Создать аккаунт"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            Нет аккаунта?{" "}
            <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="font-semibold text-primary hover:text-primary-hover">
              Зарегистрироваться
            </Link>
          </>
        ) : (
          <>
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-semibold text-primary hover:text-primary-hover">
              Войти
            </Link>
          </>
        )}
      </p>
    </Card>
  );
}
