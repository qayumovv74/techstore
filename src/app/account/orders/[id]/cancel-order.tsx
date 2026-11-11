"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import type { RetentionOffer } from "@/lib/retention";
import { cancelMyOrder, keepWithDiscount } from "./actions";

function Submit({ children, variant }: { children: React.ReactNode; variant?: "ghost" }) {
  const { pending } = useFormStatus();
  return (
    <Button variant={variant} loading={pending} className={variant ? "text-danger hover:text-danger" : undefined}>
      {children}
    </Button>
  );
}

/**
 * «Отменить заказ». Если покупателю ещё не предлагали скидку — сначала предлагаем её.
 * offer посчитан на сервере, здесь только показываем; применит и проверит его тоже сервер.
 */
export function CancelOrder({
  orderId,
  number,
  total,
  paid,
  offer,
  initiallyOpen = false,
}: {
  orderId: string;
  number: number;
  total: number;
  paid: boolean;
  offer: RetentionOffer | null;
  /** пришли со страницы оплаты по «Отменить заказ» — сразу показываем предложение */
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="self-start text-sm text-danger hover:underline">
        Отменить заказ
      </button>
    );
  }

  if (offer) {
    return (
      <section aria-label="Предложение вместо отмены" className="rounded-3xl border border-violet/50 bg-violet/10 p-5 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <Gift className="mt-0.5 size-6 shrink-0 text-lilac" aria-hidden />
          <div>
            <h3 className="text-lg font-bold">Подождите! Дарим скидку {offer.percent}%</h3>
            <p className="mt-1 text-sm text-muted">
              {offer.refund
                ? `Оставьте заказ — и мы вернём ${formatPrice(offer.refund)} на карту.`
                : `Оставьте заказ — он будет стоить ${formatPrice(offer.newTotal)} вместо ${formatPrice(total)}.`}{" "}
              Такое предложение бывает один раз.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={keepWithDiscount}>
            <input type="hidden" name="id" value={orderId} />
            <Submit>Оставить заказ со скидкой</Submit>
          </form>
          <form action={cancelMyOrder}>
            <input type="hidden" name="id" value={orderId} />
            <Submit variant="ghost">Всё равно отменить</Submit>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Подтверждение отмены" className="rounded-3xl border border-danger/40 bg-danger/5 p-5">
      <p className="text-sm">
        Отменить заказ TS-{number}?{paid ? ` ${formatPrice(total)} вернутся на карту.` : ""}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <form action={cancelMyOrder}>
          <input type="hidden" name="id" value={orderId} />
          <Submit variant="ghost">Да, отменить</Submit>
        </form>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Не отменять</Button>
      </div>
    </section>
  );
}
