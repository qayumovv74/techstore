import { statusLabel } from "@/lib/format";
import { msk } from "@/lib/datetime";
import type { OrderStatus } from "@/db/schema";

const FLOW: OrderStatus[] = ["PENDING_PAYMENT", "PAID", "ASSEMBLING", "SHIPPING", "DELIVERED"];

export function StatusBadge({ status }: { status: OrderStatus }) {
  const tone =
    status === "CANCELLED" ? "bg-danger/10 text-danger" : status === "DELIVERED" ? "bg-primary text-on-primary" : status === "PENDING_PAYMENT" ? "bg-surface-2" : "bg-primary/15 text-primary";
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{statusLabel[status]}</span>;
}

export function OrderTimeline({ status, events }: { status: OrderStatus; events: { toStatus: OrderStatus; createdAt: Date }[] }) {
  if (status === "CANCELLED") {
    const at = events.find((e) => e.toStatus === "CANCELLED")?.createdAt;
    return <p className="text-sm text-danger">Заказ отменён {at ? msk(at) : ""}</p>;
  }
  const reached = FLOW.indexOf(status);
  return (
    <ol className="grid gap-3 sm:grid-cols-5">
      {FLOW.map((s, i) => {
        const at = events.find((e) => e.toStatus === s)?.createdAt;
        const done = i <= reached;
        return (
          <li key={s} className="flex items-start gap-3 sm:flex-col sm:gap-2">
            <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${done ? "bg-primary text-on-primary" : "border border-border text-muted"}`}>
              {done ? "✓" : i + 1}
            </span>
            <span>
              <span className={`block text-sm ${done ? "font-semibold" : "text-muted"}`}>{statusLabel[s]}</span>
              {at ? <span className="text-xs text-muted">{msk(at)}</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
