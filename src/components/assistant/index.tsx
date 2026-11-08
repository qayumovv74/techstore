import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { AssistantWidget } from "./assistant-widget";

/** Помощник в углу экрана. Пользователь нужен только для аватарки в переписке. */
export function Assistant() {
  return (
    <Suspense fallback={<AssistantWidget userName={null} avatarUrl={null} />}>
      <WithUser />
    </Suspense>
  );
}

async function WithUser() {
  const user = await getCurrentUser();
  return <AssistantWidget userName={user?.name ?? null} avatarUrl={user?.avatarUrl ?? null} />;
}
