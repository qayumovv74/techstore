import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Вход" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="flex w-full flex-col gap-8">
      <Suspense fallback={<AuthForm mode="login" />}>
        <WithParams searchParams={searchParams} />
      </Suspense>
      <DemoAccounts />
    </div>
  );
}

async function WithParams({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { next, oauth } = await searchParams;
  return (
    <AuthForm
      mode="login"
      next={typeof next === "string" ? next : undefined}
      oauth={typeof oauth === "string" ? oauth : undefined}
    />
  );
}

function DemoAccounts() {
  return (
    <div className="animate-element animate-delay-1000 rounded-2xl border border-dashed border-border bg-ink/30 p-4 text-sm text-muted">
      <p className="font-semibold text-text">Демо-доступ · пароль demo12345</p>
      <ul className="mt-2 space-y-1 font-mono text-xs">
        <li>admin@techstore.ru — админ</li>
        <li>manager@techstore.ru — менеджер</li>
        <li>user@techstore.ru — покупатель</li>
      </ul>
    </div>
  );
}
