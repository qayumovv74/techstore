import { createHash, timingSafeEqual } from "node:crypto";
import { releaseExpiredReservations } from "@/lib/orders";

// На сервере: */5 * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://сайт/api/cron/release
export async function GET(req: Request) {
  if (!authorized(req.headers.get("authorization"))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const released = await releaseExpiredReservations();
  return Response.json({ released });
}

function authorized(header: string | null) {
  const secret = process.env.CRON_SECRET;
  // без секрета ручка закрыта совсем — иначе подошёл бы заголовок «Bearer undefined»
  if (!secret || secret.length < 32 || !header) return false;
  // сравниваем хеши одинаковой длины и за одинаковое время — по скорости ответа секрет не подобрать
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(header), digest(`Bearer ${secret}`));
}
