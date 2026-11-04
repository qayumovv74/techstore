"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/validation";
import { addCategory } from "../products/actions";

export function AddCategoryForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(addCategory, {});
  return (
    <form action={action} className="flex flex-wrap items-start gap-2" key={state.nonce ?? "f"}>
      <div>
        <input name="name" placeholder="Например, Игровые консоли" aria-label="Новая категория"
          className="h-10 w-72 rounded-xl border border-border bg-surface px-3 text-sm" />
        {state.fieldErrors?.name ? <p className="mt-1 text-xs text-danger">{state.fieldErrors.name[0]}</p> : null}
      </div>
      <button disabled={pending} className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover">Добавить</button>
      {state.ok ? <span className="self-center text-sm text-primary">✓ {state.message}</span> : null}
    </form>
  );
}
