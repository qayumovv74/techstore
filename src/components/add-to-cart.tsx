"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { addToCart } from "@/app/cart-actions";
import { Button } from "./ui/button";
import { buttonVariants } from "./ui/button-variants";
import { cn } from "@/lib/cn";

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
      <Link href="/cart" className={cn(buttonVariants({ variant: "outline" }), h, "group w-full border-violet/60 font-semibold text-lilac")}>
        В корзине — оформить
        <ArrowRight className="transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    );
  }

  return (
    <>
      <Button
        disabled={disabled}
        loading={pending}
        leftIcon={disabled ? undefined : <ShoppingCart aria-hidden />}
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
        className={cn(h, "w-full font-semibold")}
      >
        {disabled ? "Нет в наличии" : pending ? "Добавляем…" : "Купить"}
      </Button>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </>
  );
}
