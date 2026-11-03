"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth";

const input = z.object({ id: z.uuid(), role: z.enum(schema.roleEnum.enumValues) });

export async function changeRole(fd: FormData) {
  const admin = await requireRole(["ADMIN"]);
  const { id, role } = input.parse({ id: fd.get("id"), role: fd.get("role") });
  if (id === admin.id) return; // самому себе роль не меняем — иначе можно остаться без админа
  await db.update(schema.users).set({ role }).where(eq(schema.users.id, id));
  revalidatePath("/admin/users");
}
