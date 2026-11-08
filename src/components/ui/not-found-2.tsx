import Link from "next/link";
import type { ReactNode } from "react";
import { CompassIcon, HomeIcon } from "lucide-react";
import { buttonVariants } from "./button-variants";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "./empty";
import { cn } from "@/lib/cn";

type Props = {
  /** крупная надпись: 404, 500… */
  code?: string;
  /** заголовок страницы — подпись под кодом */
  title?: string;
  description?: ReactNode;
  /** свои кнопки вместо «На главную» и «В каталог» */
  actions?: ReactNode;
  className?: string;
};

/** Страница «не найдено» (not-found-2): огромные цифры, растворяющиеся книзу, и две кнопки */
export function NotFound({
  code = "404",
  title = "Страница не найдена",
  description = (
    <>
      Страница, которую вы ищете, переехала <br className="hidden sm:block" />
      или её никогда не было.
    </>
  ),
  actions,
  className,
}: Props) {
  return (
    <main className={cn("relative flex w-full flex-1 items-center justify-center overflow-hidden px-4 py-16", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(145_107_191/0.35),transparent_65%)] blur-3xl"
      />
      <Empty className="relative max-w-xl rounded-[2rem] border border-white/10 bg-ink/55 backdrop-blur-xl">
        <EmptyHeader className="max-w-md">
          <EmptyTitle
            aria-hidden
            className="mask-b-from-20% mask-b-to-80% bg-linear-to-b from-white to-lilac bg-clip-text text-[7rem] leading-none font-extrabold text-transparent sm:text-9xl"
          >
            {code}
          </EmptyTitle>
          <h1 className="-mt-6 text-lg font-semibold">{title}</h1>
          <EmptyDescription className="text-text/75">{description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">
            {actions ?? (
              <>
                <Link href="/" className={buttonVariants({ className: "font-semibold" })}>
                  <HomeIcon aria-hidden /> На главную
                </Link>
                <Link href="/catalog" className={buttonVariants({ variant: "outline", className: "font-semibold" })}>
                  <CompassIcon aria-hidden /> В каталог
                </Link>
              </>
            )}
          </div>
        </EmptyContent>
      </Empty>
    </main>
  );
}
