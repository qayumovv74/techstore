"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth";

const input = z.object({ id: z.uuid(), role: z.enum(schema.roleEnum.enumValues) });

export async function changeRole(fd: FormData) {
  const admin = await requireRole(["ADMIN"]);
  const { id, role } = input.parse({ id: fd.get("id"), role: fd.get("role") });
  if (id === admin.id) return; // самому себе роль не меняем — иначе можно остаться без админа
  // роль лежит и в токене сессии — пусть человек войдёт заново, уже с новыми правами
  await db
    .update(schema.users)
    .set({ role, sessionVersion: sql`${schema.users.sessionVersion} + 1` })
    .where(eq(schema.users.id, id));
  revalidatePath("/admin/users");
}
