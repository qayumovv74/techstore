"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateQty } from "@/app/cart-actions";

export function QtyControl({ productId, qty, max, name }: { productId: string; qty: number; max: number; name: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = (n: number) =>
    start(async () => {
      await updateQty(productId, n);
      router.refresh();
    });

  return (
    <div className="flex items-center gap-3">
      <div className={`inline-flex h-10 items-center rounded-xl border border-border ${pending ? "opacity-60" : ""}`}>
        <button type="button" onClick={() => set(qty - 1)} disabled={pending || qty <= 1}
          aria-label={`Уменьшить количество: ${name}`} className="grid size-10 place-items-center text-lg disabled:text-muted">−</button>
        <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{qty}</span>
        <button type="button" onClick={() => set(qty + 1)} disabled={pending || qty >= max}
          aria-label={`Увеличить количество: ${name}`} className="grid size-10 place-items-center text-lg disabled:text-muted">+</button>
      </div>
      <button type="button" onClick={() => set(0)} disabled={pending} className="text-sm text-muted hover:text-danger">
        Удалить
      </button>
    </div>
  );
}
