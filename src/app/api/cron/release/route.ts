import { releaseExpiredReservations } from "@/lib/orders";

// На сервере: */5 * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://сайт/api/cron/release
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const released = await releaseExpiredReservations();
  return Response.json({ released });
}
