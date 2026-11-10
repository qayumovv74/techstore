"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { Button, Field } from "@/components/ui";
import { PasswordField } from "@/components/password-field";
import { GoogleButton, OrDivider } from "@/components/ui/sign-in";
import { login, register } from "./actions";
import type { FormState } from "@/lib/validation";

const OAUTH_ERRORS: Record<string, string> = {
  off: "Вход через Google пока не настроен. Войдите по почте и паролю.",
  denied: "Вход через Google отменён.",
  state: "Сессия входа через Google устарела. Попробуйте ещё раз.",
  unverified: "Почта в Google-аккаунте не подтверждена.",
  staff: "Сотрудники входят только по почте и паролю.",
  error: "Google не ответил. Попробуйте ещё раз чуть позже.",
};

export function AuthForm({ mode, next, oauth }: { mode: "login" | "register"; next?: string; oauth?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "login" ? login : register, {});
  const fe = state.fieldErrors ?? {};
  const isLogin = mode === "login";
  const oauthError = oauth ? OAUTH_ERRORS[oauth] ?? OAUTH_ERRORS.error : null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="animate-element animate-delay-100 text-4xl font-semibold leading-tight md:text-5xl">
        <span className="font-light tracking-tighter">{isLogin ? "С возвращением" : "Новый аккаунт"}</span>
      </h1>
      <p className="animate-element animate-delay-200 text-muted">
        {isLogin ? "Войдите, чтобы видеть заказы, избранное и адреса доставки." : "Займёт меньше минуты — корзина сохранится в аккаунте."}
      </p>

      {oauthError ? (
        <p role="alert" className="animate-element animate-delay-200 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {oauthError}
        </p>
      ) : null}

      <form action={action} className="space-y-5" noValidate>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        {!isLogin ? (
          <div className="animate-element animate-delay-300">
            <Field label="Имя" name="name" autoComplete="name" placeholder="Как к вам обращаться" defaultValue={state.values?.name} errors={fe.name} required />
          </div>
        ) : null}
        <div className="animate-element animate-delay-300">
          <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.ru" defaultValue={state.values?.email} errors={fe.email} required />
        </div>
        <div className="animate-element animate-delay-400">
          <PasswordField
            label="Пароль"
            name="password"
            placeholder={isLogin ? "Ваш пароль" : "Минимум 8 символов"}
            autoComplete={isLogin ? "current-password" : "new-password"}
            errors={fe.password}
            required
          />
        </div>

        {isLogin ? (
          <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" name="remember" defaultChecked className="size-4 rounded accent-[#916bbf]" />
              <span className="text-text/90">Запомнить меня</span>
            </label>
            <Link href="/forgot-password" className="text-lilac transition-colors hover:underline">
              Забыли пароль?
            </Link>
          </div>
        ) : null}

        {state.error ? (
          <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
            {state.error}
          </p>
        ) : null}

        <div className="animate-element animate-delay-600">
          <Button
            type="submit"
            loading={pending}
            rightIcon={<ArrowRight aria-hidden />}
            rightIconMotion="arrow"
            className="h-12 w-full rounded-2xl text-[15px]"
          >
            {pending ? "Подождите…" : isLogin ? "Войти" : "Создать аккаунт"}
          </Button>
        </div>
      </form>

      <OrDivider className="animate-element animate-delay-700">или</OrDivider>

      <GoogleButton next={next} label={isLogin ? "Войти через Google" : "Продолжить с Google"} className="animate-element animate-delay-800" />

      <p className="animate-element animate-delay-900 text-center text-sm text-muted">
        {isLogin ? (
          <>
            Нет аккаунта?{" "}
            <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="font-semibold text-lilac hover:underline">
              Зарегистрироваться
            </Link>
          </>
        ) : (
          <>
            Уже есть аккаунт?{" "}
            <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-semibold text-lilac hover:underline">
              Войти
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
