"use client";

import Link from "next/link";
import { useEffect } from "react";
import { HomeIcon, RotateCcw } from "lucide-react";
import { NotFound } from "@/components/ui/not-found-2";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";

/** Любая непойманная ошибка на странице: тот же экран, что и 404, но с кнопкой «Попробовать снова» */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <NotFound
      code="500"
      title="Что-то пошло не так"
      description={
        <>
          Страница не загрузилась. Попробуйте ещё раз — обычно помогает.
          {error.digest ? <span className="mt-2 block font-mono text-xs text-muted">Код ошибки: {error.digest}</span> : null}
        </>
      }
      actions={
        <>
          <Button onClick={reset} leftIcon={<RotateCcw aria-hidden />} className="font-semibold">
            Попробовать снова
          </Button>
          <Link href="/" className={buttonVariants({ variant: "outline", className: "font-semibold" })}>
            <HomeIcon aria-hidden /> На главную
          </Link>
        </>
      }
    />
  );
}
