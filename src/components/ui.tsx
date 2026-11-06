import type { ComponentProps } from "react";
import { Button as BaseUiButton, type ButtonProps } from "./ui/button";
import type { ButtonVariant } from "./ui/button-variants";
import { cn } from "@/lib/cn";

type LegacyVariant = "primary" | "ghost";

/**
 * Кнопка форм. По умолчанию type="submit", как у обычной <button> внутри <form>:
 * все старые формы продолжают отправляться без правок.
 */
export function Button({
  variant = "primary",
  type = "submit",
  className,
  ...props
}: Omit<ButtonProps, "variant"> & { variant?: LegacyVariant | ButtonVariant }) {
  const v: ButtonVariant = variant === "primary" ? "default" : variant === "ghost" ? "outline" : variant;
  return <BaseUiButton type={type} variant={v} className={cn("font-semibold", className)} {...props} />;
}

/** Обёртка поля в стиле «стекла»: подсвечивается, когда внутри фокус */
export function GlassInput({ invalid, className, children }: { invalid?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-text/5 backdrop-blur-sm transition-colors",
        "focus-within:border-violet/70 focus-within:bg-violet/10",
        invalid ? "border-danger" : "border-border",
        className,
      )}
    >
      {children}
    </div>
  );
}

export const inputClass = "h-12 w-full rounded-2xl bg-transparent px-4 text-base outline-none placeholder:text-muted/60";

export function Field({
  label,
  name,
  errors,
  className,
  ...props
}: ComponentProps<"input"> & { label: string; name: string; errors?: string[] }) {
  const errorId = `${name}-error`;
  const invalid = Boolean(errors?.length);
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-muted">{label}</span>
      <GlassInput invalid={invalid}>
        <input
          name={name}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          className={cn(inputClass, className)}
          {...props}
        />
      </GlassInput>
      {invalid ? (
        <span id={errorId} className="text-danger">
          {errors![0]}
        </span>
      ) : null}
    </label>
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-3xl border border-border/80 bg-glass p-6 shadow-[0_24px_60px_-30px_rgb(0_0_0/0.8)] backdrop-blur-md", className)}
      {...props}
    />
  );
}
