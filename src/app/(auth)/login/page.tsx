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
    </div>
  );
}

async function WithParams({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { next, oauth, verified } = await searchParams;
  return (
    <>
      {verified === "1" ? (
        <p role="status" className="animate-element rounded-2xl border border-violet/40 bg-violet/10 px-4 py-3 text-sm">
          Почта подтверждена — войдите, чтобы продолжить.
        </p>
      ) : null}
      <AuthForm
        mode="login"
        next={typeof next === "string" ? next : undefined}
        oauth={typeof oauth === "string" ? oauth : undefined}
      />
    </>
  );
}
