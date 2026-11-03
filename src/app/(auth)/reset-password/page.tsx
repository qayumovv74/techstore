import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Card } from "@/components/ui";
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
      <Card className="w-full max-w-md text-center">
        <h1 className="text-xl font-bold">Ссылка неполная</h1>
        <p className="mt-2 text-sm text-muted">Откройте ссылку из письма целиком или запросите новую.</p>
        <Link href="/forgot-password" className="mt-4 inline-block font-semibold text-primary">Восстановить пароль</Link>
      </Card>
    );
  }
  return <ResetForm token={token} />;
}
