import type { ComponentProps } from "react";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export function Button({ className, variant = "primary", ...props }: ComponentProps<"button"> & { variant?: "primary" | "ghost" }) {
  return (
    <button
      className={cx(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60",
        variant === "primary" && "bg-primary text-on-primary hover:bg-primary-hover",
        variant === "ghost" && "border border-border text-text hover:bg-surface-2",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  name,
  errors,
  ...props
}: ComponentProps<"input"> & { label: string; name: string; errors?: string[] }) {
  const errorId = `${name}-error`;
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <input
        name={name}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={errors?.length ? errorId : undefined}
        className={cx(
          "h-11 rounded-xl border bg-surface px-3.5 text-base outline-none transition-colors",
          "focus:border-primary focus:ring-2 focus:ring-primary/25",
          errors?.length ? "border-danger" : "border-border",
        )}
        {...props}
      />
      {errors?.length ? (
        <span id={errorId} className="text-danger">
          {errors[0]}
        </span>
      ) : null}
    </label>
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("rounded-2xl border border-border bg-surface p-6", className)} {...props} />;
}
