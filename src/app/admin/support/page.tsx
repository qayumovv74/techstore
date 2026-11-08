import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { count, desc, eq } from "drizzle-orm";
import { Mail } from "lucide-react";
import { db, schema } from "@/db";
import { requireRole, STAFF_ROLES } from "@/lib/auth";
import { msk } from "@/lib/datetime";
import { SUPPORT_TOPICS } from "@/lib/validation";
import { supportInbox } from "@/lib/support";
import type { SupportStatus } from "@/db/schema";
import { Button } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button-variants";
import { setTicketStatus } from "./actions";

export const metadata: Metadata = { title: "Обращения" };

const STATUS: Record<SupportStatus, { label: string; tone: string }> = {
  OPEN: { label: "Новое", tone: "bg-danger/15 text-danger" },
  ANSWERED: { label: "Ответили", tone: "bg-violet/20 text-lilac" },
  CLOSED: { label: "Закрыто", tone: "bg-surface-2 text-muted" },
};

export default function SupportAdminPage({ searchParams }: PageProps<"/admin/support">) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-surface-2/60" />}>
      <Tickets searchParams={searchParams} />
    </Suspense>
  );
}

async function Tickets({ searchParams }: { searchParams: PageProps<"/admin/support">["searchParams"] }) {
  await requireRole(STAFF_ROLES, "/admin/support");
  const { status } = await searchParams;
  const filter = typeof status === "string" && status in STATUS ? (status as SupportStatus) : null;

  const [rows, counts] = await Promise.all([
    db
      .select()
      .from(schema.supportTickets)
      .where(filter ? eq(schema.supportTickets.status, filter) : undefined)
      .orderBy(desc(schema.supportTickets.createdAt))
      .limit(100),
    db.select({ status: schema.supportTickets.status, n: count() }).from(schema.supportTickets).groupBy(schema.supportTickets.status),
  ]);
  const n = (s: SupportStatus) => counts.find((c) => c.status === s)?.n ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/admin/support" className={buttonVariants({ variant: filter ? "outline" : "default", size: "sm" })}>Все</Link>
        {(Object.keys(STATUS) as SupportStatus[]).map((s) => (
          <Link key={s} href={`/admin/support?status=${s}`} className={buttonVariants({ variant: filter === s ? "default" : "outline", size: "sm" })}>
            {STATUS[s].label} · {n(s)}
          </Link>
        ))}
      </div>
      {!supportInbox() ? (
        <p className="rounded-2xl border border-dashed border-danger/60 bg-ink/55 p-4 text-sm text-danger">
          SUPPORT_INBOX в .env пуст — обращения сохраняются здесь, но на почту не приходят.
        </p>
      ) : null}

      {rows.length ? (
        <ul className="flex flex-col gap-3">
          {rows.map((t) => (
            <li key={t.id} className="rounded-3xl border border-white/10 bg-glass p-5 backdrop-blur-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    №{t.number} · {SUPPORT_TOPICS[t.topic]}
                    {t.orderNumber ? <span className="text-muted"> · заказ TS-{t.orderNumber}</span> : null}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {t.name} · {t.email} {t.userId ? <Link href={`/admin/users/${t.userId}`} className="text-lilac hover:text-white">· профиль</Link> : "· гость"} · {msk(t.createdAt)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS[t.status].tone}`}>{STATUS[t.status].label}</span>
              </div>
              <p className="mt-3 whitespace-pre-line rounded-2xl bg-ink/50 p-4 text-sm leading-relaxed">{t.message}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href={`mailto:${t.email}?subject=${encodeURIComponent(`Re: обращение №${t.number}`)}`}
                  className={buttonVariants({ size: "sm", className: "font-semibold" })}
                >
                  <Mail aria-hidden /> Ответить
                </a>
                <form action={setTicketStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={t.id} />
                  <select name="status" defaultValue={t.status} aria-label={`Статус обращения ${t.number}`} className="h-9 rounded-lg border border-border bg-bg px-2 text-sm">
                    {(Object.keys(STATUS) as SupportStatus[]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
                  </select>
                  <Button variant="outline" size="sm" className="h-9 px-3">OK</Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-white/15 bg-ink/55 p-10 text-center text-sm text-muted backdrop-blur-md">Обращений нет</p>
      )}
    </div>
  );
}
