"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Пока заказ в работе, раз в несколько секунд перезапрашиваем страницу. На этапе 5 заменим на WebSocket. */
export function AutoRefresh({ every = 8000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, every);
    return () => clearInterval(id);
  }, [router, every]);
  return null;
}
