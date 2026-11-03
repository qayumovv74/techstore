"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addToCart } from "@/app/cart-actions";

export function AddToCart({
  productId,
  inCart,
  disabled,
  size = "md",
}: {
  productId: string;
  inCart: boolean;
  disabled?: boolean;
  size?: "md" | "lg";
}) {
  const [pending, start] = useTransition();
  const [added, setAdded] = useState(inCart);
  const [error, setError] = useState("");
  const router = useRouter();
  const h = size === "lg" ? "h-12" : "h-10";

  if (added) {
    return (
      <Link href="/cart" className={`flex ${h} items-center justify-center gap-2 rounded-xl border-2 border-primary text-sm font-semibold text-primary hover:bg-surface-2`}>
        В корзине — оформить
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() =>
          start(async () => {
            const res = await addToCart(productId);
            if ("error" in res && res.error) setError(res.error);
            else {
              setAdded(true);
              router.refresh(); // обновит счётчик в шапке
            }
          })
        }
        className={`flex ${h} w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {disabled ? "Нет в наличии" : pending ? "Добавляем…" : "Купить"}
      </button>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </>
  );
}
