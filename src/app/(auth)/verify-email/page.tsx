import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ConfirmForm } from "./confirm-form";

export const metadata: Metadata = { title: "Подтверждение почты", robots: { index: false } };

export default function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  return (
    <Suspense>
      <WithToken searchParams={searchParams} />
    </Suspense>
  );
}

async function WithToken({ searchParams }: { searchParams: PageProps<"/verify-email">["searchParams"] }) {
  const { token } = await searchParams;
  if (typeof token !== "string" || token.length < 20) {
    return (
      <div className="animate-element flex flex-col gap-4">
        <h1 className="text-4xl font-light tracking-tighter">Ссылка неполная</h1>
        <p className="text-muted">Откройте ссылку из письма целиком или запросите новую в личном кабинете.</p>
        <Link href="/account" className="font-semibold text-lilac hover:underline">В личный кабинет →</Link>
      </div>
    );
  }
  return <ConfirmForm token={token} />;
}
