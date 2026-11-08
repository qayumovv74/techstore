import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/*
  Пустое состояние (shadcn/empty). Варианты EmptyMedia сделаны простым словарём,
  без class-variance-authority — ради двух вариантов отдельная зависимость не нужна.
*/

function Empty({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border-dashed p-6 text-center text-balance md:p-12",
        className,
      )}
      {...props}
    />
  );
}

function EmptyHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="empty-header" className={cn("flex max-w-sm flex-col items-center gap-2 text-center", className)} {...props} />;
}

const mediaVariants = {
  default: "bg-transparent",
  icon: "flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-text [&_svg:not([class*='size-'])]:size-6",
} as const;

function EmptyMedia({ className, variant = "default", ...props }: ComponentProps<"div"> & { variant?: keyof typeof mediaVariants }) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn("mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0", mediaVariants[variant], className)}
      {...props}
    />
  );
}

function EmptyTitle({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="empty-title" className={cn("text-lg font-medium tracking-tight", className)} {...props} />;
}

function EmptyDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-description"
      className={cn("text-sm/relaxed text-muted [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-lilac", className)}
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="empty-content" className={cn("flex w-full min-w-0 max-w-sm flex-col items-center gap-4 text-sm text-balance", className)} {...props} />
  );
}

export { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia };
