"use client";

import { useActionState } from "react";
import { Button, Field } from "@/components/ui";
import { PhoneInput } from "@/components/phone-input";
import type { ActionState } from "@/lib/validation";
import { addAddress, changePassword, logoutOtherDevices, updateProfile } from "./actions";

function Status({ state }: { state: ActionState }) {
  if (state.error) return <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{state.error}</p>;
  if (state.ok) return <p role="status" className="text-sm font-medium text-primary">✓ {state.message}</p>;
  return null;
}

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateProfile, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Field label="Имя" name="name" autoComplete="name" defaultValue={state.values?.name ?? name} errors={fe.name} />
      <PhoneInput name="phone" defaultValue={state.values?.phone ?? phone} errors={fe.phone} />
      <div className="flex items-center gap-4">
        <Button disabled={pending}>{pending ? "Сохраняю…" : "Сохранить"}</Button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(changePassword, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-4" noValidate key={state.nonce ?? "edit"}>
      <Field label="Текущий пароль" name="current" type="password" autoComplete="current-password" errors={fe.current} />
      <Field label="Новый пароль" name="next" type="password" autoComplete="new-password" errors={fe.next} />
      <Field label="Повторите новый пароль" name="confirm" type="password" autoComplete="new-password" errors={fe.confirm} />
      <div className="flex items-center gap-4">
        <Button disabled={pending}>{pending ? "Меняю…" : "Сменить пароль"}</Button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function SessionsForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(logoutOtherDevices, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-4">
      <Button variant="ghost" disabled={pending}>{pending ? "Выходим…" : "Выйти на других устройствах"}</Button>
      <Status state={state} />
    </form>
  );
}

export function AddressForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(addAddress, {});
  const fe = state.fieldErrors ?? {};
  const v = state.ok ? {} : (state.values ?? {});
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2" noValidate key={state.nonce ?? "edit"}>
      <Field label="Название" name="label" placeholder="Дом" defaultValue={v.label ?? "Дом"} errors={fe.label} />
      <Field label="Город" name="city" autoComplete="address-level2" defaultValue={v.city ?? "Москва"} errors={fe.city} />
      <div className="sm:col-span-2">
        <Field label="Улица и дом" name="street" autoComplete="address-line1" placeholder="ул. Тверская, д. 7"
          defaultValue={v.street} errors={fe.street} />
      </div>
      <Field label="Квартира / офис" name="apartment" autoComplete="address-line2" defaultValue={v.apartment} errors={fe.apartment} />
      <Field label="Комментарий курьеру" name="comment" placeholder="Подъезд 2, домофон 15" defaultValue={v.comment} errors={fe.comment} />
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="isDefault" className="size-4 accent-[var(--primary)]" />
        Сделать основным
      </label>
      <div className="flex items-center gap-4 sm:col-span-2">
        <Button disabled={pending}>{pending ? "Сохраняю…" : "Добавить адрес"}</Button>
        <Status state={state} />
      </div>
    </form>
  );
}
