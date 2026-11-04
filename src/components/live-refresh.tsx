"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Подписка на события сервера (SSE). Пришло событие — перерисовываем страницу.
 * Если соединение недоступно, раз в минуту обновляемся сами.
 */
export function LiveRefresh({ topics }: { topics: string[] }) {
  const router = useRouter();
  const [live, setLive] = useState(false);
  const key = topics.join(",");

  useEffect(() => {
    const qs = key.split(",").map((t) => `topic=${encodeURIComponent(t)}`).join("&");
    const source = new EventSource(`/api/events?${qs}`);
    let timer: ReturnType<typeof setTimeout> | undefined;
    source.onopen = () => setLive(true);
    source.onerror = () => setLive(false);
    source.onmessage = () => {
      // несколько событий подряд (оплата + письмо + статус) — одно обновление
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 150);
    };
    const fallback = setInterval(() => {
      if (source.readyState !== EventSource.OPEN && document.visibilityState === "visible") router.refresh();
    }, 60_000);
    return () => {
      source.close();
      clearTimeout(timer);
      clearInterval(fallback);
    };
  }, [key, router]);

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted" aria-live="polite">
      <span className={`size-2 rounded-full ${live ? "bg-primary" : "bg-border"}`} />
      {live ? "обновляется в реальном времени" : "подключаемся…"}
    </span>
  );
}
