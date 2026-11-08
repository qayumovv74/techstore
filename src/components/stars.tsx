import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

/** Оценка звёздами (только показ). value может быть дробным — 4.6 → 4 полные звезды и часть пятой */
export function Stars({ value, className, size = "size-4" }: { value: number; className?: string; size?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`Оценка ${value.toFixed(1)} из 5`}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className={cn("relative inline-block", size)}>
            <Star className={cn("absolute inset-0 text-white/20", size)} aria-hidden />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={cn("fill-[#f5c26b] text-[#f5c26b]", size)} aria-hidden />
            </span>
          </span>
        );
      })}
    </span>
  );
}
