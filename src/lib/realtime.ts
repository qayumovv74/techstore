import "server-only";
import { EventEmitter } from "node:events";
import { Client } from "pg";

/**
 * Обновления в реальном времени без Redis и отдельного сервера:
 * изменения публикуются через PostgreSQL NOTIFY (внутри той же транзакции — придут только после commit),
 * а каждый процесс Next.js держит одно соединение с LISTEN и раздаёт события подписчикам SSE.
 */
export const CHANNEL = "techstore_events";

export type LiveEvent = { topic: string; orderId?: string; userId?: string; status?: string };

type Hub = { emitter: EventEmitter; client: Client | null; connecting: Promise<void> | null };
const g = globalThis as unknown as { liveHub?: Hub };
const hub: Hub = (g.liveHub ??= { emitter: new EventEmitter().setMaxListeners(0), client: null, connecting: null });

async function connect() {
  if (hub.client) return;
  if (hub.connecting) return hub.connecting;
  hub.connecting = (async () => {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    client.on("notification", (msg) => {
      try {
        hub.emitter.emit("event", JSON.parse(msg.payload ?? "{}") as LiveEvent);
      } catch {}
    });
    // соединение упало (рестарт базы) — переподключимся при следующей подписке
    client.on("error", () => {
      hub.client = null;
    });
    client.on("end", () => {
      hub.client = null;
    });
    await client.connect();
    await client.query(`LISTEN ${CHANNEL}`);
    hub.client = client;
  })().finally(() => {
    hub.connecting = null;
  });
  return hub.connecting;
}

export async function subscribe(onEvent: (e: LiveEvent) => void) {
  await connect();
  hub.emitter.on("event", onEvent);
  return () => hub.emitter.off("event", onEvent);
}
