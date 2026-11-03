"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/** Сортировка применяется сразу при выборе. Без JS выбор сохраняется через скрытое поле формы фильтров. */
export function SortSelect({ value, options, hrefs }: { value: string; options: Record<string, string>; hrefs: Record<string, string> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">Сортировка</span>
      <select
        value={value}
        disabled={pending}
        onChange={(e) => start(() => router.push(hrefs[e.target.value]))}
        className="h-10 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
      >
        {Object.entries(options).map(([k, label]) => (
          <option key={k} value={k}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
