"use server";

import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { removeUpload, saveAvatar, UploadError } from "@/lib/uploads";
import { addressSchema, passwordSchema, profileSchema, type ActionState } from "@/lib/validation";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");

export async function updateProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("/account/profile");
  const raw = { name: str(fd, "name"), phone: str(fd, "phone") };
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values: raw };

  await db
    .update(schema.users)
    .set({ name: parsed.data.name, phone: parsed.data.phone || null })
    .where(eq(schema.users.id, user.id));
  revalidatePath("/account", "layout");
  return { ok: true, message: "Сохранено" };
}

export async function changePassword(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("/account/profile");
  const parsed = passwordSchema.safeParse({ current: str(fd, "current"), next: str(fd, "next"), confirm: str(fd, "confirm") });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const row = await db.query.users.findFirst({ where: eq(schema.users.id, user.id), columns: { passwordHash: true } });
  if (!row || !(await bcrypt.compare(parsed.data.current, row.passwordHash))) {
    return { fieldErrors: { current: ["Неверный текущий пароль"] } };
  }
  await db
    .update(schema.users)
    .set({ passwordHash: await bcrypt.hash(parsed.data.next, 10) })
    .where(eq(schema.users.id, user.id));
  return { ok: true, message: "Пароль изменён", nonce: Date.now() };
}

const MAX_ADDRESSES = 10;

export async function addAddress(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("/account/addresses");
  const raw = {
    label: str(fd, "label"),
    city: str(fd, "city"),
    street: str(fd, "street"),
    apartment: str(fd, "apartment"),
    comment: str(fd, "comment"),
  };
  const parsed = addressSchema.safeParse({ ...raw, isDefault: fd.get("isDefault") === "on" });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values: raw };

  const existing = await db.select({ id: schema.addresses.id }).from(schema.addresses).where(eq(schema.addresses.userId, user.id));
  if (existing.length >= MAX_ADDRESSES) return { error: `Можно сохранить до ${MAX_ADDRESSES} адресов`, values: raw };

  // Первый адрес всегда основной
  const makeDefault = parsed.data.isDefault || existing.length === 0;
  await db.transaction(async (tx) => {
    if (makeDefault) {
      await tx.update(schema.addresses).set({ isDefault: false }).where(eq(schema.addresses.userId, user.id));
    }
    await tx.insert(schema.addresses).values({
      userId: user.id,
      ...parsed.data,
      apartment: parsed.data.apartment || null,
      comment: parsed.data.comment || null,
      isDefault: makeDefault,
    });
  });
  revalidatePath("/account", "layout");
  return { ok: true, message: "Адрес сохранён", nonce: Date.now() };
}

const idSchema = z.uuid();

export async function deleteAddress(fd: FormData) {
  const user = await requireUser("/account/addresses");
  const id = idSchema.parse(fd.get("id"));
  await db.transaction(async (tx) => {
    // where с userId — нельзя удалить чужой адрес, подменив id
    const [removed] = await tx
      .delete(schema.addresses)
      .where(and(eq(schema.addresses.id, id), eq(schema.addresses.userId, user.id)))
      .returning();
    if (removed?.isDefault) {
      const next = await tx.query.addresses.findFirst({ where: eq(schema.addresses.userId, user.id) });
      if (next) await tx.update(schema.addresses).set({ isDefault: true }).where(eq(schema.addresses.id, next.id));
    }
  });
  revalidatePath("/account", "layout");
}

export async function setDefaultAddress(fd: FormData) {
  const user = await requireUser("/account/addresses");
  const id = idSchema.parse(fd.get("id"));
  await db.transaction(async (tx) => {
    const own = await tx.query.addresses.findFirst({
      where: and(eq(schema.addresses.id, id), eq(schema.addresses.userId, user.id)),
    });
    if (!own) return;
    await tx.update(schema.addresses).set({ isDefault: false }).where(eq(schema.addresses.userId, user.id));
    await tx.update(schema.addresses).set({ isDefault: true }).where(eq(schema.addresses.id, id));
  });
  revalidatePath("/account", "layout");
}

export async function updateAvatar(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("/account/profile");
  const file = fd.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { error: "Выберите фото" };

  let url: string;
  try {
    url = await saveAvatar(file);
  } catch (e) {
    if (e instanceof UploadError) return { error: e.message };
    throw e;
  }
  await db.update(schema.users).set({ avatarUrl: url }).where(eq(schema.users.id, user.id));
  await removeUpload(user.avatarUrl); // старый файл больше не нужен
  revalidatePath("/", "layout");
  return { ok: true, message: "Фото обновлено", nonce: Date.now() };
}

export async function removeAvatar() {
  const user = await requireUser("/account/profile");
  await db.update(schema.users).set({ avatarUrl: null }).where(eq(schema.users.id, user.id));
  await removeUpload(user.avatarUrl);
  revalidatePath("/", "layout");
}
