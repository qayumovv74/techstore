"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireRole, STAFF_ROLES } from "@/lib/auth";
import type { SupportStatus } from "@/db/schema";

const STATUSES: SupportStatus[] = ["OPEN", "ANSWERED", "CLOSED"];

export async function setTicketStatus(fd: FormData) {
  await requireRole(STAFF_ROLES, "/admin/support");
  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "") as SupportStatus;
  if (!STATUSES.includes(status)) return;
  await db.update(schema.supportTickets).set({ status }).where(eq(schema.supportTickets.id, id));
  revalidatePath("/admin/support");
}
