import { formatPrice } from "@/lib/format";

const short = (d: string) => `${Number(d.slice(8))}.${d.slice(5, 7)}`;

/** Столбики выручки по дням. Простой SVG — ради одного графика тащить библиотеку незачем. */
export function RevenueChart({ data }: { data: { day: string; revenue: number; orders: number }[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const W = 700, H = 200, pad = 28, bw = (W - pad) / data.length;
  const empty = data.every((d) => d.revenue === 0);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" role="img" aria-label="Выручка по дням за две недели">
        {[0.5, 1].map((f) => (
          <line key={f} x1={pad} x2={W} y1={H - (H - 10) * f} y2={H - (H - 10) * f} stroke="var(--border)" strokeDasharray="3 4" />
        ))}
        <line x1={pad} x2={W} y1={H} y2={H} stroke="var(--border)" />
        {data.map((d, i) => {
          const h = (d.revenue / max) * (H - 10);
          const x = pad + i * bw + bw * 0.18;
          const today = i === data.length - 1;
          return (
            <g key={d.day}>
              <title>{`${short(d.day)}: ${formatPrice(d.revenue)}, заказов: ${d.orders}`}</title>
              <rect x={x} y={H - Math.max(h, d.revenue ? 2 : 0)} width={bw * 0.64} height={Math.max(h, d.revenue ? 2 : 0)} rx="4"
                fill={today ? "var(--primary)" : "var(--color-lilac)"} />
              {i % 2 === data.length % 2 || today ? (
                <text x={x + bw * 0.32} y={H + 16} textAnchor="middle" fontSize="11" fill="var(--muted)">{short(d.day)}</text>
              ) : null}
            </g>
          );
        })}
        <text x={0} y={14} fontSize="11" fill="var(--muted)">{formatPrice(max)}</text>
      </svg>
      {empty ? (
        <p className="absolute inset-0 grid place-items-center text-sm text-muted">За две недели оплаченных заказов не было</p>
      ) : null}
    </div>
  );
}
