import { Suspense } from "react";
import { count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { getCartCount } from "@/lib/cart";
import { MainNav } from "./main-nav";

/** Нижняя «жидкая» панель на телефоне — как в приложениях магазинов */
export function MobileTabbar() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center pb-[calc(env(safe-area-inset-bottom)+10px)] md:hidden">
      <Suspense fallback={<MainNav variant="mobile" userName={null} favCount={0} cartCount={0} className="pointer-events-auto" />}>
        <WithCounts />
      </Suspense>
    </div>
  );
}

async function WithCounts() {
  const user = await getCurrentUser();
  const [favCount, cartCount] = await Promise.all([
    user
      ? db.select({ n: count() }).from(schema.favorites).where(eq(schema.favorites.userId, user.id)).then((r) => r[0].n)
      : 0,
    getCartCount(),
  ]);
  return <MainNav variant="mobile" userName={user?.name ?? null} favCount={favCount} cartCount={cartCount} className="pointer-events-auto" />;
}
