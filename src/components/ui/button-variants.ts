import { cn } from "@/lib/cn";

/*
  Классы кнопок отдельно от самого компонента: их можно вызывать и в серверных
  компонентах (например, чтобы оформить <Link> как кнопку).
  Цвета берутся из токенов сайта (--primary, --text, --bg…), высоты и радиус — из --primitive-* в globals.css.
*/

export type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "white" | "destructive" | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const base =
  "wensity-button relative inline-flex shrink-0 transform-gpu items-center justify-center gap-2 whitespace-nowrap rounded-[var(--primitive-radius-control,0.875rem)] shadow-none " +
  "text-sm font-medium select-none touch-manipulation " +
  "transition-[background-color,border-color,color,opacity,transform] duration-180 ease-[var(--primitive-ease,cubic-bezier(0.23,1,0.32,1))] motion-reduce:transition-[background-color,border-color,color,opacity] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primitive-ring,color-mix(in_srgb,var(--text)_45%,transparent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] " +
  "disabled:pointer-events-none disabled:opacity-45 data-disabled:pointer-events-none data-disabled:opacity-45 " +
  "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

const pressable =
  "active:scale-[0.97] active:duration-100 motion-reduce:active:scale-100 disabled:active:scale-100 data-disabled:active:scale-100";

const variants: Record<ButtonVariant, string> = {
  default: cn(
    pressable,
    "border border-[color-mix(in_srgb,var(--primitive-control-solid,var(--primary))_88%,var(--bg))] bg-[color:var(--primitive-control-solid,var(--primary))] text-[color:var(--primitive-control-solid-foreground,var(--on-primary))] " +
      "hover:border-[color-mix(in_srgb,var(--primitive-control-solid-hover,color-mix(in_srgb,var(--primary)_90%,var(--bg)))_82%,var(--bg))] hover:bg-[color:var(--primitive-control-solid-hover,color-mix(in_srgb,var(--primary)_90%,var(--bg)))] " +
      "active:border-[color-mix(in_srgb,var(--primitive-control-solid-active,color-mix(in_srgb,var(--primary)_82%,var(--bg)))_92%,var(--bg))] active:bg-[color:var(--primitive-control-solid-active,color-mix(in_srgb,var(--primary)_82%,var(--bg)))]",
  ),
  secondary: cn(
    pressable,
    "border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] " +
      "hover:border-[color:var(--border-strong,color-mix(in_srgb,var(--text)_16%,transparent))] hover:bg-[color:var(--primitive-surface-hover,color-mix(in_srgb,var(--text)_4%,transparent))] " +
      "active:border-[color:var(--border-strong,color-mix(in_srgb,var(--text)_16%,transparent))] active:bg-[color:var(--primitive-surface-active,color-mix(in_srgb,var(--text)_8%,transparent))]",
  ),
  outline: cn(
    pressable,
    "border border-[color:var(--border-strong,color-mix(in_srgb,var(--text)_16%,transparent))] bg-transparent text-[var(--text)] " +
      "hover:border-[color-mix(in_srgb,var(--text)_20%,var(--bg))] hover:bg-[color:var(--primitive-surface-hover,color-mix(in_srgb,var(--text)_4%,transparent))] " +
      "active:border-[color-mix(in_srgb,var(--text)_26%,var(--bg))] active:bg-[color:var(--primitive-surface-active,color-mix(in_srgb,var(--text)_8%,transparent))]",
  ),
  ghost: cn(
    pressable,
    "border border-transparent bg-transparent text-[var(--muted)] " +
      "hover:border-[color-mix(in_srgb,var(--text)_10%,transparent)] hover:bg-[color:var(--primitive-surface-hover,color-mix(in_srgb,var(--text)_4%,transparent))] hover:text-[var(--text)] " +
      "active:border-[color-mix(in_srgb,var(--text)_14%,transparent)] active:bg-[color:var(--primitive-surface-active,color-mix(in_srgb,var(--text)_8%,transparent))]",
  ),
  // на тёмной теме — как default
  white: cn(
    pressable,
    "border border-[color-mix(in_srgb,var(--text)_10%,var(--bg))] bg-[color:var(--primitive-surface-elevated,var(--surface))] text-[var(--text)] " +
      "hover:border-[color-mix(in_srgb,var(--text)_14%,var(--bg))] hover:bg-[color:var(--primitive-surface-hover,color-mix(in_srgb,var(--text)_4%,transparent))] " +
      "active:border-[color-mix(in_srgb,var(--text)_18%,var(--bg))] active:bg-[color:var(--primitive-surface-active,color-mix(in_srgb,var(--text)_8%,transparent))] " +
      "dark:border-[color-mix(in_srgb,var(--primitive-control-solid,var(--primary))_88%,var(--bg))] dark:bg-[color:var(--primitive-control-solid,var(--primary))] dark:text-[color:var(--primitive-control-solid-foreground,var(--on-primary))] " +
      "dark:hover:bg-[color:var(--primitive-control-solid-hover,color-mix(in_srgb,var(--primary)_90%,var(--bg)))]",
  ),
  destructive: cn(
    pressable,
    "border border-[color-mix(in_srgb,var(--primitive-destructive,var(--danger))_78%,var(--text))] bg-[color:var(--primitive-destructive,var(--danger))] text-[color:var(--primitive-destructive-foreground,#ffffff)] " +
      "hover:bg-[color:var(--primitive-destructive-hover,color-mix(in_srgb,var(--danger)_88%,black))] " +
      "active:bg-[color:var(--primitive-destructive-active,color-mix(in_srgb,var(--danger)_78%,black))]",
  ),
  link:
    "h-auto border border-transparent bg-transparent px-0 font-medium text-[var(--text)] underline-offset-4 " +
    "hover:text-[var(--muted)] hover:underline hover:decoration-[color-mix(in_srgb,var(--text)_35%,transparent)] " +
    "active:scale-100 active:text-[var(--text)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-[var(--primitive-control-height-sm,2rem)] gap-1.5 px-3.5 text-xs",
  md: "h-[var(--primitive-control-height-md,2.25rem)] gap-2 px-4",
  lg: "h-[var(--primitive-control-height-lg,2.5rem)] gap-2 px-5 text-[15px]",
  icon: "h-9 w-9 gap-0 p-0",
};

export function buttonVariants({
  variant = "default",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(base, variants[variant], sizes[size], className);
}
