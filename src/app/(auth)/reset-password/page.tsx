import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Новый пароль" };

export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  return (
    <Suspense>
      <WithToken searchParams={searchParams} />
    </Suspense>
  );
}

async function WithToken({ searchParams }: { searchParams: PageProps<"/reset-password">["searchParams"] }) {
  const { token } = await searchParams;
  if (typeof token !== "string" || token.length < 20) {
    return (
      <div className="animate-element flex flex-col gap-4">
        <h1 className="text-4xl font-light tracking-tighter">Ссылка неполная</h1>
        <p className="text-muted">Откройте ссылку из письма целиком или запросите новую.</p>
        <Link href="/forgot-password" className="font-semibold text-lilac hover:underline">Восстановить пароль →</Link>
      </div>
    );
  }
  return <ResetForm token={token} />;
}
