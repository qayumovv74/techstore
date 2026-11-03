import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Вход" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <Suspense fallback={<AuthForm mode="login" />}>
        <WithNext searchParams={searchParams} />
      </Suspense>
      <DemoAccounts />
    </div>
  );
}

async function WithNext({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { next } = await searchParams;
  return <AuthForm mode="login" next={typeof next === "string" ? next : undefined} />;
}

function DemoAccounts() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
      <p className="font-semibold text-text">Демо-доступ · пароль demo12345</p>
      <ul className="mt-2 space-y-1 font-mono text-xs">
        <li>admin@techstore.uz — админ</li>
        <li>manager@techstore.uz — менеджер</li>
        <li>user@techstore.uz — покупатель</li>
      </ul>
    </div>
  );
}
