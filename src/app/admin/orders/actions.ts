"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { schema } from "@/db";
import { requireRole, STAFF_ROLES } from "@/lib/auth";
import { changeStatus } from "@/lib/orders";

const input = z.object({ id: z.uuid(), to: z.enum(schema.orderStatusEnum.enumValues) });

export async function setOrderStatus(fd: FormData) {
  const staff = await requireRole(STAFF_ROLES);
  const { id, to } = input.parse({ id: fd.get("id"), to: fd.get("to") });
  await changeStatus(id, to, staff.id);
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}
