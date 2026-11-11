"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireRole, STAFF_ROLES } from "@/lib/auth";
import type { SupportStatus } from "@/db/schema";

const STATUSES: SupportStatus[] = ["OPEN", "ANSWERED", "CLOSED"];

export async function setTicketStatus(fd: FormData) {
  await requireRole(STAFF_ROLES, "/admin/support");
  const parsedId = z.uuid().safeParse(fd.get("id"));
  const status = String(fd.get("status") ?? "") as SupportStatus;
  if (!parsedId.success || !STATUSES.includes(status)) return;
  const id = parsedId.data;
  await db.update(schema.supportTickets).set({ status }).where(eq(schema.supportTickets.id, id));
  revalidatePath("/admin/support");
}
