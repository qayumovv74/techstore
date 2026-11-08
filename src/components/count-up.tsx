"use client";

import { useEffect, useRef } from "react";
import { animate } from "motion";

/** Число «досчитывает» от нуля, когда появляется на экране (motion). Без JS видно сразу итоговое значение. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !value || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = Math.round(v).toLocaleString("ru-RU");
      },
    });
    return () => controls.stop();
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString("ru-RU")}
    </span>
  );
}
