/**
 * Ограничение частоты: «не больше N действий за окно» на один IP.
 *
 * Счётчики живут в памяти процесса. Сайт работает одним процессом (docker compose),
 * поэтому общее хранилище не нужно; после перезапуска счётчики обнуляются — для защиты
 * от перебора и спама формами этого хватает. Неудачные входы по конкретному email
 * дополнительно считаются по журналу в базе (lib/login-guard.ts) и переживают перезапуск.
 *
 * В e2e-тестах все запросы идут с 127.0.0.1, поэтому там лимиты выключены: RATE_LIMIT=off.
 */
import "server-only";
import { headers } from "next/headers";
import { clientIp } from "./audit";

const LIMITS = {
  login: { limit: 20, windowMs: 15 * 60_000 },
  register: { limit: 5, windowMs: 60 * 60_000 },
  forgot: { limit: 5, windowMs: 15 * 60_000 },
  verifyEmail: { limit: 10, windowMs: 15 * 60_000 },
  support: { limit: 5, windowMs: 60 * 60_000 },
  review: { limit: 10, windowMs: 60 * 60_000 },
  assistant: { limit: 30, windowMs: 60_000 },
  checkout: { limit: 10, windowMs: 15 * 60_000 },
} as const;

export type LimitName = keyof typeof LIMITS;

// на globalThis — чтобы горячая перезагрузка в разработке не плодила копии счётчиков
const store: Map<string, number[]> = ((globalThis as { __rateLimit?: Map<string, number[]> }).__rateLimit ??= new Map());
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  const longest = Math.max(...Object.values(LIMITS).map((l) => l.windowMs));
  for (const [key, hits] of store) {
    if (!hits.length || now - hits[hits.length - 1] > longest) store.delete(key);
  }
}

/** ok: false — лимит исчерпан, retryAfter — через сколько секунд можно снова */
export function take(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  sweep(now);
  const hits = (store.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    store.set(key, hits);
    return { ok: false as const, retryAfter: Math.ceil((hits[0] + windowMs - now) / 1000) };
  }
  hits.push(now);
  store.set(key, hits);
  return { ok: true as const, retryAfter: 0 };
}

export async function limitByIp(name: LimitName) {
  if (process.env.RATE_LIMIT === "off") return { ok: true as const, retryAfter: 0 };
  const ip = clientIp(await headers()) ?? "unknown";
  const { limit, windowMs } = LIMITS[name];
  return take(`${name}:${ip}`, limit, windowMs);
}

export function tooManyMessage(retryAfter: number) {
  const min = Math.max(1, Math.ceil(retryAfter / 60));
  return `Слишком много попыток. Попробуйте через ${min} мин.`;
}
