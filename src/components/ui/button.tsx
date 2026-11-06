"use client";

import * as React from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { cn } from "@/lib/cn";
import { buttonVariants, type ButtonSize, type ButtonVariant } from "./button-variants";

export { buttonVariants, type ButtonSize, type ButtonVariant };

/* Кнопка на Base UI. Классы и варианты — в button-variants.ts */

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  loading?: boolean;
  disabled?: boolean;
  /** Оставить кнопку фокусируемой, даже когда она disabled (поведение Base UI). */
  focusableWhenDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Анимация левой иконки при наведении. */
  leftIconMotion?: "trash" | "mail";
  /** Анимация правой иконки при наведении. */
  rightIconMotion?: "arrow" | "download";
}

const ICON_SHELL = "relative z-10 inline-flex shrink-0";
const ICON_MOTION_SHELL = "btn-icon-motion inline-flex shrink-0 origin-center transform-gpu";

const leftIconMotionClass = {
  trash: cn(ICON_MOTION_SHELL, "btn-icon-motion--trash"),
  mail: cn(ICON_MOTION_SHELL, "btn-icon-motion--mail"),
} as const;

const rightIconMotionClass = {
  arrow: cn(ICON_MOTION_SHELL, "btn-icon-motion--arrow"),
  download: cn(ICON_MOTION_SHELL, "btn-icon-motion--download"),
} as const;

const BUTTON_ICON_KEYFRAMES_ID = "button-icon-keyframes";

function ensureButtonIconKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(BUTTON_ICON_KEYFRAMES_ID)) return;

  const style = document.createElement("style");
  style.id = BUTTON_ICON_KEYFRAMES_ID;
  style.textContent = `
    @keyframes button-trash-shake {
      0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
      24% { transform: translate3d(-0.5px, -1px, 0) rotate(-4deg); }
      48% { transform: translate3d(0.5px, -1px, 0) rotate(3deg); }
      72% { transform: translate3d(-0.25px, -0.5px, 0) rotate(-1.5deg); }
    }
    @keyframes button-mail-lift {
      0% { transform: translate3d(0, 0, 0) rotate(0deg); }
      46% { transform: translate3d(2px, -2px, 0) rotate(-5deg); }
      100% { transform: translate3d(0, 0, 0) rotate(0deg); }
    }
    @keyframes button-download-tick {
      0%, 100% { transform: translate3d(0, 0, 0); }
      46% { transform: translate3d(0, 2.5px, 0); }
    }
    .btn-icon-motion--arrow {
      transition: transform 160ms var(--primitive-ease, cubic-bezier(0.23, 1, 0.32, 1));
    }
    @media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
      .wensity-button:hover .btn-icon-motion--trash {
        animation: button-trash-shake 340ms var(--primitive-ease, cubic-bezier(0.23, 1, 0.32, 1)) both;
      }
      .wensity-button:hover .btn-icon-motion--mail {
        animation: button-mail-lift 320ms var(--primitive-ease, cubic-bezier(0.23, 1, 0.32, 1)) both;
      }
      .wensity-button:hover .btn-icon-motion--arrow {
        transform: translate3d(2px, 0, 0);
      }
      .wensity-button:active .btn-icon-motion--arrow {
        transform: translate3d(1px, 0, 0);
      }
      .wensity-button:hover .btn-icon-motion--download {
        animation: button-download-tick 300ms var(--primitive-ease, cubic-bezier(0.23, 1, 0.32, 1)) both;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .btn-icon-motion {
        animation: none !important;
        transition: none !important;
        transform: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      asChild = false,
      loading = false,
      disabled = false,
      focusableWhenDisabled,
      leftIcon,
      rightIcon,
      leftIconMotion,
      rightIconMotion,
      children,
      type,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    const hasIconMotion = Boolean(leftIconMotion || rightIconMotion);

    React.useLayoutEffect(() => {
      if (hasIconMotion) ensureButtonIconKeyframes();
    }, [hasIconMotion]);

    const composedClassName = buttonVariants({
      variant,
      size,
      className: cn(hasIconMotion && "group", className),
    });

    const content = (
      <>
        {loading ? <ButtonSpinner /> : null}
        {!loading && leftIcon ? (
          <span className={cn(ICON_SHELL, leftIconMotion && leftIconMotionClass[leftIconMotion])}>{leftIcon}</span>
        ) : null}
        {size === "icon" && !loading && !leftIcon && !rightIcon ? (
          <span className={cn(ICON_SHELL, "items-center justify-center")}>{children}</span>
        ) : (
          <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
        )}
        {!loading && rightIcon ? (
          <span className={cn(ICON_SHELL, rightIconMotion && rightIconMotionClass[rightIconMotion])}>{rightIcon}</span>
        ) : null}
      </>
    );

    if (asChild && React.isValidElement(children)) {
      // Свойства кнопки переносятся на дочерний элемент (например, <Link>)
      return (
        <BaseButton
          data-wensity-primitive=""
          ref={ref as React.Ref<HTMLElement>}
          disabled={isDisabled}
          focusableWhenDisabled={focusableWhenDisabled}
          nativeButton={false}
          className={composedClassName}
          aria-busy={loading ? true : undefined}
          data-loading={loading ? "" : undefined}
          render={children as React.ReactElement}
          {...props}
        />
      );
    }

    return (
      <BaseButton
        data-wensity-primitive=""
        ref={ref}
        disabled={isDisabled}
        focusableWhenDisabled={focusableWhenDisabled}
        type={type ?? "button"}
        className={composedClassName}
        aria-busy={loading ? true : undefined}
        data-loading={loading ? "" : undefined}
        {...props}
      >
        {content}
      </BaseButton>
    );
  },
);

Button.displayName = "Button";

function ButtonSpinner() {
  return (
    <span
      aria-hidden="true"
      className="relative z-10 size-3.5 shrink-0 rounded-full border-2 border-current border-r-transparent opacity-80 motion-safe:animate-spin"
    />
  );
}
