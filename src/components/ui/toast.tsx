"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, X } from "lucide-react";

/**
 * Всплывающее уведомление в углу. Показывается, когда меняется nonce, и само прячется через duration мс.
 * Состояние «закрыто» хранится как nonce, который уже скрыли — так не нужен setState прямо в эффекте.
 */
export function Toast({ nonce, children, duration = 5000 }: { nonce?: number; children: ReactNode; duration?: number }) {
  const [dismissed, setDismissed] = useState<number | undefined>(undefined);
  const open = nonce !== undefined && nonce !== dismissed;

  useEffect(() => {
    if (nonce === undefined) return;
    const t = setTimeout(() => setDismissed(nonce), duration);
    return () => clearTimeout(t);
  }, [nonce, duration]);

  return (
    <div className="pointer-events-none fixed top-24 right-4 z-[80] md:top-28 md:right-6" aria-live="polite">
      <AnimatePresence>
        {open ? (
          <motion.div
            key={nonce}
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex max-w-sm items-start gap-3 rounded-2xl border border-violet/40 bg-surface/95 p-4 text-sm shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)] backdrop-blur-xl"
          >
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-lilac" aria-hidden />
            <div className="min-w-0 flex-1">{children}</div>
            <button type="button" onClick={() => setDismissed(nonce)} aria-label="Закрыть уведомление" className="text-muted hover:text-text">
              <X className="size-4" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
