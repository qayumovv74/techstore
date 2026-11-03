"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { POPULAR_CITIES, searchCities } from "@/data/cities";
import { setCity } from "@/app/city-actions";
import { IconPin } from "./icons";

export function CityPicker({ city }: { city: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [pending, start] = useTransition();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const results = searchCities(query);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const close = (e: MouseEvent) => !boxRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function choose(name: string) {
    start(async () => {
      await setCity(name);
      setOpen(false);
      setQuery("");
      router.refresh();
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") setOpen(false);
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[active]);
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 font-medium text-text hover:text-primary"
      >
        <IconPin className="size-4 text-primary" />
        {city}
        <span aria-hidden className="text-muted">▾</span>
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-40 mt-2 w-80 rounded-2xl border border-border bg-surface p-4 text-sm shadow-xl">
          <p className="font-semibold">Выберите город</p>
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={listId}
            aria-activedescendant={results.length ? `${listId}-${active}` : undefined}
            aria-label="Название города"
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Начните вводить, например «Каз»"
            className="mt-3 h-10 w-full rounded-xl border border-border bg-bg px-3 outline-none focus:border-primary"
          />

          {query ? (
            results.length ? (
              <ul id={listId} role="listbox" className="mt-2 max-h-64 overflow-y-auto">
                {results.map((name, i) => (
                  <li
                    key={name}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      choose(name);
                    }}
                    className={`cursor-pointer rounded-lg px-3 py-2 ${i === active ? "bg-surface-2 text-primary" : ""}`}
                  >
                    <Highlight text={name} query={query} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-muted">Не нашли такой город. Пока доставляем только в города из списка.</p>
            )
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {POPULAR_CITIES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => choose(name)}
                  className={`rounded-full border px-3 py-1 text-xs ${name === city ? "border-primary text-primary" : "border-border hover:border-primary"}`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
          {pending ? <p className="mt-2 text-xs text-muted">Сохраняем…</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const i = text.toLowerCase().replace(/ё/g, "е").indexOf(query.toLowerCase().replace(/ё/g, "е").trim());
  if (i < 0) return <>{text}</>;
  const len = query.trim().length;
  return (
    <>
      {text.slice(0, i)}
      <b>{text.slice(i, i + len)}</b>
      {text.slice(i + len)}
    </>
  );
}
