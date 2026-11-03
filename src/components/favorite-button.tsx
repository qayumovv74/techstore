"use client";

import { usePathname, useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toggleFavorite } from "@/app/favorite-actions";

export function FavoriteButton({
  productId,
  initial,
  className = "",
  withLabel = false,
}: {
  productId: string;
  initial: boolean;
  className?: string;
  withLabel?: boolean;
}) {
  const [favored, setFavored] = useOptimistic(initial);
  const [, start] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <button
      type="button"
      aria-pressed={favored}
      aria-label={favored ? "Убрать из избранного" : "В избранное"}
      title={favored ? "Убрать из избранного" : "В избранное"}
      onClick={() =>
        start(async () => {
          setFavored(!favored); // сердечко меняется сразу, не дожидаясь сервера
          const res = await toggleFavorite(productId);
          if ("needLogin" in res) router.push(`/login?next=${encodeURIComponent(pathname)}`);
          else router.refresh();
        })
      }
      className={`inline-flex items-center justify-center gap-2 rounded-xl transition-colors ${
        favored ? "text-danger" : "text-muted hover:text-danger"
      } ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill={favored ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.6 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.6 0 5.8 3.5 4.5 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" strokeLinejoin="round" />
      </svg>
      {withLabel ? <span className="text-sm">{favored ? "В избранном" : "В избранное"}</span> : null}
    </button>
  );
}
