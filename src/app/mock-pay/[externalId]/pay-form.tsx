"use client";

import { useActionState, useState } from "react";
import { processPayment, type PayState } from "./actions";

const groups = (v: string, sizes: number[], sep: string) => {
  const d = v.replace(/\D/g, "");
  const out: string[] = [];
  let i = 0;
  for (const s of sizes) {
    if (i >= d.length) break;
    out.push(d.slice(i, i + s));
    i += s;
  }
  return out.join(sep);
};

export function PayForm({ externalId, amountLabel }: { externalId: string; amountLabel: string }) {
  const [state, action, pending] = useActionState<PayState, FormData>(processPayment.bind(null, externalId), {});
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");

  const input = "h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none focus:border-zinc-900";
  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <label className="text-sm text-zinc-600">
        Номер карты
        <input name="card" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" value={card}
          onChange={(e) => setCard(groups(e.target.value, [4, 4, 4, 4], " "))} className={`mt-1 ${input} tabular-nums`} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-zinc-600">
          ММ/ГГ
          <input name="exp" inputMode="numeric" autoComplete="cc-exp" placeholder="12/28" value={exp}
            onChange={(e) => setExp(groups(e.target.value, [2, 2], "/"))} className={`mt-1 ${input}`} />
        </label>
        <label className="text-sm text-zinc-600">
          CVC
          <input name="cvc" inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={3} className={`mt-1 ${input}`} />
        </label>
      </div>
      {state.error ? <p role="alert" className="text-sm text-red-600">{state.error}</p> : null}
      <button disabled={pending} className="mt-2 h-12 rounded-lg bg-zinc-900 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-60">
        {pending ? "Проводим платёж…" : `Оплатить ${amountLabel}`}
      </button>
    </form>
  );
}
