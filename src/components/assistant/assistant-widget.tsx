"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, LifeBuoy, MessageCircle, RotateCcw, X } from "lucide-react";
import MessageConversation, { type ConversationMessage } from "@/components/ui/messaging-conversation";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/ui/avatar";
import { askAssistant } from "@/app/assistant-actions";
import type { AssistantReply } from "@/lib/assistant";
import { cn } from "@/lib/cn";

type Msg = { id: string; mine: boolean; text: string; time: string; reply?: AssistantReply };

const STORAGE_KEY = "ts-assistant";
const CHIPS = ["Подобрать смартфон", "Ноутбук для учёбы", "Наушники до 10 000 ₽", "Где мой заказ?", "Доставка и оплата"];

// crypto.randomUUID есть только в https и на localhost — с телефона по адресу 192.168.x.x его нет
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const now = () => new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
const welcome = (): Msg => ({
  id: "welcome",
  mine: false,
  time: now(),
  text: "Здравствуйте! Я помощник TechStore. Подберу технику под задачу и бюджет, подскажу про доставку, оплату и заказы.",
  reply: { text: "", chips: CHIPS },
});

function load(): Msg[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as Msg[]) : null;
    return list?.length ? list : [welcome()];
  } catch {
    return [welcome()];
  }
}

const AssistantAvatar = ({ className }: { className?: string }) => (
  <span className={cn("grid size-8 place-items-center rounded-full bg-linear-to-br from-violet to-indigo ring-1 ring-white/20", className)}>
    <Image src="/brand/mark-silver.png" alt="" width={22} height={12} className="h-auto w-[22px]" />
  </span>
);

/** Плавающий помощник: кнопка в углу и окно переписки. На страницах админки не показывается. */
export function AssistantWidget(props: { userName: string | null; avatarUrl: string | null }) {
  return (
    <Suspense fallback={null}>
      <Widget {...props} />
    </Suspense>
  );
}

function Widget({ userName, avatarUrl }: { userName: string | null; avatarUrl: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => (typeof window === "undefined" ? [welcome()] : load()));
  const [draft, setDraft] = useState("");
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      // приватный режим — переписка просто не переживёт перезагрузку
    }
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (pathname.startsWith("/admin")) return null;

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean || pending) return;
    setDraft("");
    setMessages((m) => [...m, { id: uid(), mine: true, text: clean, time: now() }]);
    start(async () => {
      const reply = await askAssistant(clean);
      setMessages((m) => [...m, { id: uid(), mine: false, text: reply.text, time: now(), reply }]);
    });
  };

  const last = messages.at(-1);
  const view: ConversationMessage[] = messages.map((m) => ({
    id: m.id,
    mine: m.mine,
    text: m.text,
    time: m.time,
    extra: m.reply ? <ReplyExtra reply={m.reply} onChip={send} showChips={m.id === last?.id} /> : undefined,
  }));

  return (
    <div className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+88px)] z-40 flex flex-col items-end gap-3 md:right-6 md:bottom-6">
      <AnimatePresence>
        {open ? (
          <motion.div
            key="panel"
            role="dialog"
            aria-label="Помощник TechStore"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="origin-bottom-right"
          >
            <MessageConversation
              className="h-[min(560px,calc(100dvh-190px))] w-[min(380px,calc(100vw-2rem))] border-white/15 bg-surface/95 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)] backdrop-blur-xl"
              title="Помощник TechStore"
              statusText={pending ? "печатает…" : "онлайн · отвечает сразу"}
              avatar={<AssistantAvatar />}
              myAvatar={<UserAvatar name={userName ?? "Вы"} src={avatarUrl} className="size-8 text-xs" />}
              messages={view}
              typing={pending}
              onClose={() => setOpen(false)}
              onCopy={(m) => navigator.clipboard?.writeText(m.text).catch(() => {})}
              onDelete={(m) => setMessages((list) => list.filter((x) => x.id !== m.id))}
              headerMenu={
                <>
                  <DropdownMenuItem onClick={() => setMessages([welcome()])}>
                    <RotateCcw aria-hidden /> Очистить переписку
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setOpen(false);
                      router.push("/support");
                    }}
                  >
                    <LifeBuoy aria-hidden /> Написать в поддержку
                  </DropdownMenuItem>
                </>
              }
              footer={
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send(draft);
                  }}
                  className="flex items-center gap-2"
                >
                  <label htmlFor="assistant-input" className="sr-only">Сообщение помощнику</label>
                  <input
                    id="assistant-input"
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    maxLength={500}
                    autoComplete="off"
                    placeholder="Например: ноутбук до 80 000"
                    className="h-11 min-w-0 flex-1 rounded-2xl border border-border bg-text/5 px-4 text-sm outline-none placeholder:text-muted/60 focus:border-violet/70"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || pending}
                    aria-label="Отправить"
                    className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-40"
                  >
                    <ArrowUp className="size-5" aria-hidden />
                  </button>
                </form>
              }
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Свернуть помощника" : "Открыть помощника"}
        className="group relative flex h-14 items-center gap-2 rounded-full border border-white/15 bg-linear-to-br from-violet to-indigo pr-5 pl-4 font-semibold text-white shadow-[0_16px_40px_-12px_rgb(145_107_191/0.8)] transition-transform hover:scale-[1.03] active:scale-95 max-md:size-14 max-md:justify-center max-md:p-0"
      >
        {!open ? <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-violet/30 [animation-duration:2.5s]" /> : null}
        {open ? <X className="relative size-5" aria-hidden /> : <MessageCircle className="relative size-5" aria-hidden />}
        <span className="relative text-sm max-md:hidden">{open ? "Свернуть" : "Помощник"}</span>
      </button>
    </div>
  );
}

function ReplyExtra({ reply, onChip, showChips }: { reply: AssistantReply; onChip: (t: string) => void; showChips: boolean }) {
  return (
    <div className="mt-2 flex flex-col gap-2">
      {reply.products?.length ? (
        <ul className="flex flex-col gap-1.5">
          {reply.products.map((p) => (
            <li key={p.slug}>
              <Link href={`/product/${p.slug}`} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-ink/40 p-1.5 pr-3 transition-colors hover:border-violet/60">
                <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-white">
                  {p.image ? <Image src={p.image} alt="" fill sizes="44px" className="object-cover" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">{p.brand} {p.name}</span>
                  <span className="text-xs text-lilac">{p.price}{p.inStock ? "" : " · нет в наличии"}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {reply.links?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {reply.links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full border border-violet/50 bg-violet/10 px-3 py-1 text-xs font-semibold text-lilac transition-colors hover:bg-violet/25">
              {l.label} →
            </Link>
          ))}
        </div>
      ) : null}
      {showChips && reply.chips?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {reply.chips.map((c) => (
            <button key={c} type="button" onClick={() => onChip(c)} className="rounded-full border border-white/15 px-3 py-1 text-xs transition-colors hover:border-violet/60 hover:bg-violet/15">
              {c}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
