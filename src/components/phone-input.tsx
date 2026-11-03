"use client";

import { useState } from "react";

const PREFIX = "+7 (";

// +7 (900) 123-45-67 из любых введённых цифр
function format(digits: string) {
  const d = digits.slice(0, 10);
  let out = PREFIX + d.slice(0, 3);
  if (d.length > 3) out += ") " + d.slice(3, 6);
  if (d.length > 6) out += "-" + d.slice(6, 8);
  if (d.length > 8) out += "-" + d.slice(8, 10);
  return out;
}

function digitsOf(value: string) {
  let d = value.replace(/\D/g, "");
  if (d.length === 11 && /^[78]/.test(d)) return d.slice(1); // вставили 8900… или 7900…
  if (d.startsWith("7")) d = d.slice(1); // семёрка из префикса +7
  if (d.length === 11 && d[0] === "8") d = d.slice(1); // вставили 8900… после префикса
  return d.slice(0, 10);
}

export function PhoneInput({
  name,
  defaultValue = "",
  errors,
  label = "Телефон",
}: {
  name: string;
  defaultValue?: string;
  errors?: string[];
  label?: string;
}) {
  const [value, setValue] = useState(defaultValue ? format(digitsOf(defaultValue)) : "");
  const errorId = `${name}-error`;

  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <input
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+7 (900) 123-45-67"
        value={value}
        onFocus={() => !value && setValue(PREFIX)}
        onBlur={() => value === PREFIX && setValue("")}
        onChange={(e) => {
          const next = e.target.value;
          let d = digitsOf(next);
          // стёрли скобку или дефис — убираем и цифру перед ним, иначе маска не даст удалить
          if (next.length < value.length && d === digitsOf(value)) d = d.slice(0, -1);
          setValue(d.length || next.length >= PREFIX.length ? format(d) : "");
        }}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={errors?.length ? errorId : undefined}
        className={`h-11 rounded-xl border bg-surface px-3.5 text-base tabular-nums outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25 ${
          errors?.length ? "border-danger" : "border-border"
        }`}
      />
      {errors?.length ? <span id={errorId} className="text-danger">{errors[0]}</span> : null}
    </label>
  );
}
