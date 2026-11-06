"use client";

import { useActionState, useState } from "react";
import { PhoneInput } from "@/components/phone-input";
import { Button, Field } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import type { ActionState } from "@/lib/validation";
import { submitCheckout } from "./actions";
import { ArrowRight } from "lucide-react";

type Address = { id: string; label: string; city: string; street: string; apartment: string | null; isDefault: boolean };

export function CheckoutForm(props: {
  name: string;
  phone: string;
  city: string;
  addresses: Address[];
  itemsTotal: number;
  count: number;
  courier: { when: string; price: number };
  pickupWhen: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(submitCheckout, {});
  const v = state.values ?? {};
  const fe = state.fieldErrors ?? {};
  const [delivery, setDelivery] = useState(v.delivery || "COURIER");
  const defaultAddress = props.addresses.find((a) => a.isDefault)?.id ?? props.addresses[0]?.id ?? "new";
  const [addressId, setAddressId] = useState(v.addressId || defaultAddress);
  const deliveryPrice = delivery === "PICKUP" ? 0 : props.courier.price;

  return (
    <form action={action} noValidate className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-semibold">1. Получатель</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Имя" name="name" autoComplete="name" defaultValue={v.name ?? props.name} errors={fe.name} />
            <PhoneInput name="phone" defaultValue={v.phone ?? props.phone} errors={fe.phone} />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-semibold">2. Доставка · {props.city}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { id: "COURIER", title: "Курьером", sub: `${props.courier.when} · ${props.courier.price ? formatPrice(props.courier.price) : "бесплатно"}` },
              { id: "PICKUP", title: "Самовывоз", sub: `${props.pickupWhen} · бесплатно` },
            ].map((o) => (
              <label key={o.id} className={`cursor-pointer rounded-xl border-2 p-4 ${delivery === o.id ? "border-primary" : "border-border"}`}>
                <input type="radio" name="delivery" value={o.id} checked={delivery === o.id} onChange={() => setDelivery(o.id)} className="sr-only" />
                <span className="block font-semibold">{o.title}</span>
                <span className="text-sm text-muted">{o.sub}</span>
              </label>
            ))}
          </div>

          {delivery === "COURIER" ? (
            <div className="mt-5 flex flex-col gap-3">
              {props.addresses.map((a) => (
                <label key={a.id} className="flex cursor-pointer items-start gap-3 text-sm">
                  <input type="radio" name="addressId" value={a.id} checked={addressId === a.id} onChange={() => setAddressId(a.id)}
                    className="mt-0.5 size-4 accent-[var(--primary)]" />
                  <span><b>{a.label}</b> — {a.city}, {a.street}{a.apartment ? `, кв. ${a.apartment}` : ""}</span>
                </label>
              ))}
              {props.addresses.length ? (
                <label className="flex cursor-pointer items-center gap-3 text-sm">
                  <input type="radio" name="addressId" value="new" checked={addressId === "new"} onChange={() => setAddressId("new")}
                    className="size-4 accent-[var(--primary)]" />
                  Другой адрес
                </label>
              ) : (
                <input type="hidden" name="addressId" value="new" />
              )}
              {addressId === "new" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label={`Улица и дом, ${props.city}`} name="street" placeholder="ул. Тверская, д. 7" defaultValue={v.street} errors={fe.street} />
                  </div>
                  <Field label="Квартира / офис" name="apartment" defaultValue={v.apartment} />
                  <Field label="Подъезд, домофон" name="addressComment" defaultValue={v.addressComment} />
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">Заберёте в пункте выдачи TechStore, {props.city}. Пришлём SMS, когда заказ будет готов.</p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-semibold">3. Комментарий</h2>
          <textarea name="comment" defaultValue={v.comment} rows={3} maxLength={500} placeholder="Например, позвонить за час"
            className="mt-3 w-full rounded-xl border border-border bg-bg p-3 text-sm outline-none focus:border-primary" />
        </section>
      </div>

      <aside className="h-fit rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-28">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Товары ({props.count})</dt><dd>{formatPrice(props.itemsTotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Доставка</dt><dd>{deliveryPrice ? formatPrice(deliveryPrice) : "бесплатно"}</dd></div>
        </dl>
        <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
          <span className="font-semibold">Итого</span>
          <span className="text-2xl font-bold">{formatPrice(props.itemsTotal + deliveryPrice)}</span>
        </div>
        {state.error ? <p role="alert" className="mt-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p> : null}
        <Button loading={pending} size="lg" rightIcon={<ArrowRight aria-hidden />} rightIconMotion="arrow" className="mt-5 h-12 w-full">
          {pending ? "Оформляем…" : "Перейти к оплате"}
        </Button>
        <p className="mt-2 text-center text-xs text-muted">Товары резервируются на 15 минут</p>
      </aside>
    </form>
  );
}
