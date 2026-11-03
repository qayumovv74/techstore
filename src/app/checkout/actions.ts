"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { getCity } from "@/lib/city";
import { deliveryInfo } from "@/data/cities";
import { OrderError, placeOrder } from "@/lib/orders";
import { profileSchema, type ActionState } from "@/lib/validation";

const checkoutSchema = z
  .object({
    name: profileSchema.shape.name,
    phone: profileSchema.shape.phone.refine((v) => v !== "", "Укажите телефон — курьер позвонит"),
    delivery: z.enum(["COURIER", "PICKUP"]),
    addressId: z.string().optional(),
    street: z.string().trim().max(120).optional(),
    apartment: z.string().trim().max(20).optional(),
    addressComment: z.string().trim().max(200).optional(),
    comment: z.string().trim().max(500).optional(),
  })
  .refine((d) => d.delivery === "PICKUP" || (d.addressId && d.addressId !== "new") || (d.street && d.street.length >= 3), {
    path: ["street"],
    message: "Укажите улицу и дом",
  });

export async function submitCheckout(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("/checkout");
  const raw = Object.fromEntries(
    ["name", "phone", "delivery", "addressId", "street", "apartment", "addressComment", "comment"].map((k) => [k, String(fd.get(k) ?? "")]),
  );
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values: raw };
  const d = parsed.data;

  const [cart, city] = await Promise.all([getCart(), getCity()]);
  if (!cart.items.length) return { error: "Корзина пуста", values: raw };
  const info = deliveryInfo(city);

  let address: { city: string; street: string; apartment?: string | null; comment?: string | null };
  if (d.delivery === "PICKUP") {
    address = { city, street: "Пункт выдачи TechStore" };
  } else if (d.addressId && d.addressId !== "new") {
    const saved = await db.query.addresses.findFirst({
      where: and(eq(schema.addresses.id, d.addressId), eq(schema.addresses.userId, user.id)),
    });
    if (!saved) return { error: "Адрес не найден", values: raw };
    address = { city: saved.city, street: saved.street, apartment: saved.apartment, comment: saved.comment };
  } else {
    address = { city, street: d.street!, apartment: d.apartment || null, comment: d.addressComment || null };
  }

  let payUrl: string;
  try {
    ({ payUrl } = await placeOrder({
      userId: user.id,
      lines: cart.items.map((i) => ({ productId: i.id, qty: i.qty })),
      contactName: d.name,
      contactPhone: d.phone,
      deliveryMethod: d.delivery,
      deliveryPrice: d.delivery === "PICKUP" ? 0 : info.courierPrice,
      address,
      comment: d.comment,
    }));
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message, values: raw };
    throw e;
  }
  revalidatePath("/", "layout"); // корзина очищена — обновим счётчик в шапке
  redirect(payUrl);
}
