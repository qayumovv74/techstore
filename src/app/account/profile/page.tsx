import type { Metadata } from "next";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { formatPhone } from "@/lib/validation";
import { Card } from "@/components/ui";
import { PasswordForm, ProfileForm } from "../forms";
import { PanelSkeleton } from "../skeleton";

export const metadata: Metadata = { title: "Профиль" };

export default function ProfilePage() {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <Profile />
    </Suspense>
  );
}

async function Profile() {
  const user = await requireUser("/account/profile");
  const row = await db.query.users.findFirst({ where: eq(schema.users.id, user.id), columns: { phone: true } });
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="text-lg font-bold">Личные данные</h2>
        <p className="mt-1 text-sm text-muted">Email для входа: {user.email}</p>
        <div className="mt-5 max-w-md">
          <ProfileForm name={user.name} phone={formatPhone(row?.phone)} />
        </div>
      </Card>
      <Card>
        <h2 className="text-lg font-bold">Смена пароля</h2>
        <p className="mt-1 text-sm text-muted">Минимум 8 символов, буквы и цифры.</p>
        <div className="mt-5 max-w-md">
          <PasswordForm />
        </div>
      </Card>
    </div>
  );
}
