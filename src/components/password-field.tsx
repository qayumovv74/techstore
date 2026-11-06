"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { GlassInput, inputClass } from "./ui";
import { cn } from "@/lib/cn";

/** Поле пароля с кнопкой «показать символы» */
export function PasswordField({
  label,
  name,
  errors,
  className,
  ...props
}: Omit<ComponentProps<"input">, "type"> & { label: string; name: string; errors?: string[] }) {
  const [shown, setShown] = useState(false);
  const errorId = `${name}-error`;
  const invalid = Boolean(errors?.length);

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <label htmlFor={`f-${name}`} className="font-medium text-muted">{label}</label>
      <GlassInput invalid={invalid}>
        <div className="relative">
          <input
            id={`f-${name}`}
            name={name}
            type={shown ? "text" : "password"}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? errorId : undefined}
            className={cn(inputClass, "pr-12", className)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShown((v) => !v)}
            aria-label={shown ? "Скрыть символы" : "Показать символы"}
            className="absolute inset-y-0 right-3 flex items-center text-muted transition-colors hover:text-text"
          >
            {shown ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
      </GlassInput>
      {invalid ? <span id={errorId} className="text-danger">{errors![0]}</span> : null}
    </div>
  );
}
