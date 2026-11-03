/**
 * Иллюстрация-заглушка, пока у товара нет фото.
 * Рисуем силуэт устройства по категории в цветах палитры.
 */
type Props = { category: string; brand: string; className?: string };

export function ProductArt({ category, brand, className }: Props) {
  return (
    <div className={`relative grid place-items-center overflow-hidden bg-surface-2 ${className ?? ""}`}>
      <svg viewBox="0 0 120 120" className="h-3/5 w-3/5" aria-hidden fill="none" strokeLinecap="round" strokeLinejoin="round">
        <Device category={category} />
      </svg>
      <span className="absolute bottom-2 right-3 text-[10px] font-semibold uppercase tracking-widest text-muted/70">
        {brand}
      </span>
    </div>
  );
}

function Device({ category }: { category: string }) {
  const body = { fill: "var(--color-teal)", fillOpacity: 0.12, stroke: "var(--color-teal)", strokeWidth: 3 };
  const line = { stroke: "var(--color-aqua)", strokeWidth: 3 };
  switch (category) {
    case "smartphones":
      return (
        <>
          <rect x="36" y="10" width="48" height="100" rx="10" {...body} />
          <rect x="52" y="17" width="16" height="4" rx="2" fill="var(--color-aqua)" />
          <path d="M48 96h24" {...line} />
        </>
      );
    case "laptops":
      return (
        <>
          <rect x="22" y="24" width="76" height="52" rx="6" {...body} />
          <path d="M10 88h100l-8 10H18z" {...body} />
          <path d="M50 92h20" {...line} />
        </>
      );
    case "audio":
      return (
        <>
          <path d="M24 70V58a36 36 0 0 1 72 0v12" stroke="var(--color-teal)" strokeWidth="5" />
          <rect x="16" y="64" width="20" height="36" rx="8" {...body} />
          <rect x="84" y="64" width="20" height="36" rx="8" {...body} />
        </>
      );
    case "tablets":
      return (
        <>
          <rect x="20" y="14" width="80" height="92" rx="10" {...body} />
          <circle cx="60" cy="98" r="2.5" fill="var(--color-aqua)" />
        </>
      );
    case "wearables":
      return (
        <>
          <path d="M44 10h32l-4 20H48zM44 110h32l-4-20H48z" {...body} />
          <rect x="34" y="28" width="52" height="64" rx="16" {...body} />
          <path d="M60 48v14l9 6" {...line} />
        </>
      );
    default:
      return <rect x="24" y="24" width="72" height="72" rx="14" {...body} />;
  }
}
