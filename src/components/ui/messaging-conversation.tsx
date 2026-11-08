"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Copy, MoreHorizontal, MoreVertical, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "./card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";
import { ScrollArea } from "./scroll-area";
import { buttonVariants } from "./button-variants";
import { cn } from "@/lib/cn";

/*
  Окно переписки (messaging-conversation от hextaui), переделанное в презентационный компонент:
  сообщения, аватары, меню действий приходят снаружи — так его использует помощник магазина.
*/

type StatusType = "online" | "dnd" | "offline";

const STATUS_COLORS: Record<StatusType, string> = {
  online: "bg-emerald-400",
  dnd: "bg-red-500",
  offline: "bg-gray-400",
};

function StatusBadge({ status }: { status: StatusType }) {
  return <span aria-hidden className={cn("inline-block size-2.5 rounded-full ring-2 ring-surface", STATUS_COLORS[status])} />;
}

export type ConversationMessage = {
  id: string;
  mine: boolean;
  text: string;
  time: string;
  /** что-то под текстом: карточки товаров, ссылки */
  extra?: ReactNode;
};

function MessageActions({ mine, onCopy, onDelete }: { mine: boolean; onCopy: () => void; onDelete?: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Действия с сообщением" className={buttonVariants({ variant: "ghost", size: "icon", className: "size-7 rounded-lg" })}>
        <MoreHorizontal aria-hidden className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-40">
        <DropdownMenuItem onClick={onCopy}>
          <Copy aria-hidden /> Копировать
        </DropdownMenuItem>
        {mine && onDelete ? (
          <DropdownMenuItem onClick={onDelete} className="text-danger">
            <Trash2 aria-hidden /> Удалить
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function MessageConversation({
  title,
  status = "online",
  statusText = "онлайн",
  avatar,
  myAvatar,
  messages,
  typing = false,
  headerMenu,
  footer,
  onCopy,
  onDelete,
  onClose,
  className,
}: {
  title: string;
  status?: StatusType;
  statusText?: string;
  avatar: ReactNode;
  myAvatar: ReactNode;
  messages: ConversationMessage[];
  typing?: boolean;
  /** пункты меню в шапке (DropdownMenuItem) */
  headerMenu?: ReactNode;
  footer?: ReactNode;
  onCopy?: (m: ConversationMessage) => void;
  onDelete?: (m: ConversationMessage) => void;
  onClose?: () => void;
  className?: string;
}) {
  const viewport = useRef<HTMLDivElement>(null);

  // новое сообщение — прокручиваем вниз
  useEffect(() => {
    const el = viewport.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, typing]);

  return (
    <Card className={cn("flex min-h-0 w-full flex-col overflow-hidden shadow-none", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 border-b border-white/10 bg-surface/80 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            {avatar}
            <span className="absolute -right-0.5 -bottom-0.5"><StatusBadge status={status} /></span>
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-xs text-muted">{statusText}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {headerMenu ? (
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Действия с чатом" className={buttonVariants({ variant: "ghost", size: "icon", className: "rounded-xl" })}>
                <MoreVertical aria-hidden className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-48">{headerMenu}</DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {onClose ? (
            <button type="button" onClick={onClose} aria-label="Свернуть чат" className={buttonVariants({ variant: "ghost", size: "icon", className: "rounded-xl" })}>
              <X aria-hidden className="size-4" />
            </button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 p-0">
        <ScrollArea className="h-full" viewportRef={viewport} viewportClassName="px-4">
          <div role="log" aria-label="Переписка с помощником" aria-live="polite" className="flex flex-col gap-4 py-4">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("group flex gap-2", msg.mine ? "justify-end" : "justify-start")}>
                <div className={cn("flex max-w-[88%] items-start gap-2", msg.mine && "flex-row-reverse")}>
                  <div className="mt-0.5 shrink-0">{msg.mine ? myAvatar : avatar}</div>
                  <div className={cn("min-w-0", msg.mine && "flex flex-col items-end")}>
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-line",
                        msg.mine ? "rounded-tr-md bg-primary text-on-primary" : "rounded-tl-md bg-white/8 text-text",
                      )}
                    >
                      {msg.text}
                    </div>
                    {msg.extra}
                    <div className="mt-1 flex items-center gap-1">
                      <time className="text-[11px] text-muted">{msg.time}</time>
                      {onCopy ? (
                        <div className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                          <MessageActions mine={msg.mine} onCopy={() => onCopy(msg)} onDelete={onDelete ? () => onDelete(msg) : undefined} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {typing ? (
              <div className="flex items-center gap-2" aria-label="Помощник печатает">
                {avatar}
                <span className="flex gap-1 rounded-2xl rounded-tl-md bg-white/8 px-3 py-3">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="size-1.5 animate-bounce rounded-full bg-lilac" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </span>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </CardContent>

      {footer ? <div className="border-t border-white/10 bg-surface/80 p-3">{footer}</div> : null}
    </Card>
  );
}
