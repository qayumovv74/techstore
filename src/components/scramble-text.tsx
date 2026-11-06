"use client";

import { useEffect, useRef } from "react";

/**
 * Текст «перебирает» символы и собирается в исходный (anime.js scrambleText).
 * Играет при появлении и при наведении. Без JS или при reduced-motion — просто текст.
 */
export function ScrambleText({ children, className }: { children: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let alive = true;
    let play = () => {};

    import("animejs").then(({ animate, scrambleText }) => {
      if (!alive) return;
      play = () =>
        animate(el, {
          textContent: scrambleText({ text: children, chars: "A-Z0-9#%_", cursor: "▌", duration: 900 }),
          duration: 900,
        });
      play();
      el.addEventListener("mouseenter", play);
    });

    return () => {
      alive = false;
      el.removeEventListener("mouseenter", play);
    };
  }, [children]);

  return (
    <span ref={ref} className={className} aria-label={children}>
      {children}
    </span>
  );
}
