import { logout } from "@/app/(auth)/actions";
import { AccountNav } from "./account-nav";

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Личный кабинет</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="flex flex-col gap-2 lg:sticky lg:top-28 lg:h-fit">
          <AccountNav />
          <form action={logout} className="hidden lg:block">
            <button className="flex h-10 w-full items-center rounded-xl px-4 text-sm text-danger hover:bg-surface-2">Выйти</button>
          </form>
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}
