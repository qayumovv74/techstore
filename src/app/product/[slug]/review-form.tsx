"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui";
import type { ActionState } from "@/lib/validation";
import { submitReview } from "@/app/review-actions";
import { cn } from "@/lib/cn";

const HINTS = ["", "Плохо", "Так себе", "Нормально", "Хорошо", "Отлично"];

export function ReviewForm({ productId, initial }: { productId: string; initial?: { rating: number; text: string } }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(submitReview, {});
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const shown = hover || rating;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="productId" value={productId} />
      <fieldset>
        <legend className="text-sm font-medium text-muted">Ваша оценка</legend>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="cursor-pointer p-0.5" onMouseEnter={() => setHover(n)}>
                <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" aria-label={`${n} из 5 — ${HINTS[n]}`} />
                <Star
                  aria-hidden
                  className={cn("size-7 transition-transform", n <= shown ? "scale-110 fill-[#f5c26b] text-[#f5c26b]" : "text-white/25")}
                />
              </label>
            ))}
          </div>
          <span className="text-sm text-lilac">{HINTS[shown]}</span>
        </div>
        {state.fieldErrors?.rating ? <p className="mt-1 text-sm text-danger">{state.fieldErrors.rating[0]}</p> : null}
      </fieldset>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-muted">Отзыв</span>
        <textarea
          name="text"
          rows={4}
          defaultValue={state.values?.text ?? initial?.text}
          placeholder="Что понравилось, что нет, кому подойдёт"
          className={cn(
            "rounded-2xl border bg-text/5 px-4 py-3 text-base outline-none backdrop-blur-sm transition-colors placeholder:text-muted/60 focus:border-violet/70 focus:bg-violet/10",
            state.fieldErrors?.text ? "border-danger" : "border-border",
          )}
        />
        {state.fieldErrors?.text ? <span className="text-danger">{state.fieldErrors.text[0]}</span> : null}
      </label>

      {state.error ? <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</p> : null}
      {state.ok ? <p role="status" className="text-sm text-lilac">✓ {state.message}</p> : null}

      <Button loading={pending} className="w-fit px-6">
        {initial ? "Обновить отзыв" : "Опубликовать отзыв"}
      </Button>
    </form>
  );
}
