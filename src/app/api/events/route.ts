import { readSession } from "@/lib/session";
import { subscribe, type LiveEvent } from "@/lib/realtime";

/**
 * Server-Sent Events. Клиент подписывается на темы:
 *   orders        — все заказы (только менеджер/админ)
 *   order:<id>    — один заказ (его владелец или сотрудник)
 */
export async function GET(req: Request) {
  const session = await readSession();
  if (!session) return new Response("unauthorized", { status: 401 });
  const staff = session.role !== "CUSTOMER";
  const topics = new URL(req.url).searchParams.getAll("topic");

  const allowed = (e: LiveEvent) => {
    if (topics.includes("orders") && staff) return true;
    if (e.orderId && topics.includes(`order:${e.orderId}`)) return staff || e.userId === session.userId;
    return false;
  };

  const encoder = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };
      send("retry: 3000\n\n");
      const unsubscribe = await subscribe((e) => {
        if (allowed(e)) send(`data: ${JSON.stringify({ orderId: e.orderId, status: e.status })}\n\n`);
      });
      // комментарий раз в 25 с — чтобы прокси (Nginx) не закрыл «молчащее» соединение
      const ping = setInterval(() => send(": ping\n\n"), 25_000);
      cleanup = () => {
        clearInterval(ping);
        unsubscribe();
      };
      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Nginx: не буферизовать поток
    },
  });
}
