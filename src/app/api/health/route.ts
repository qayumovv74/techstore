import { sql } from "drizzle-orm";
import { db } from "@/db";

// Проверка для Docker/мониторинга: ?db=1 дополнительно пингует базу
export async function GET(req: Request) {
  if (new URL(req.url).searchParams.has("db")) {
    try {
      await db.execute(sql`select 1`);
    } catch {
      return Response.json({ ok: false, db: "down" }, { status: 503 });
    }
  }
  return Response.json({ ok: true });
}
