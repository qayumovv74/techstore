import { logout } from "@/app/(auth)/actions";
import { AccountNav } from "./account-nav";
import { Button } from "@/components/ui";

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Личный кабинет</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="flex min-w-0 flex-col gap-2 lg:sticky lg:top-28 lg:h-fit">
          <AccountNav />
          <form action={logout} className="hidden lg:block">
            <Button variant="ghost" className="w-full justify-start px-4 font-normal text-danger hover:text-danger">Выйти</Button>
          </form>
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}
