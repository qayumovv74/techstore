import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { roleLabel } from "@/lib/format";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Личный кабинет" };

export default function AccountPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-surface-2" />}>
        <Account />
      </Suspense>
    </main>
  );
}

async function Account() {
  const user = await requireUser("/account");
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Здравствуйте, {user.name}</h1>
      <Card>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted">Email</dt>
          <dd>{user.email}</dd>
          <dt className="text-muted">Роль</dt>
          <dd>{roleLabel[user.role]}</dd>
        </dl>
      </Card>
      <Card>
        <h2 className="font-semibold">Мои заказы</h2>
        <p className="mt-1 text-sm text-muted">Пока пусто. Заказы и их статус в реальном времени появятся на этапе 3.</p>
      </Card>
    </div>
  );
}
