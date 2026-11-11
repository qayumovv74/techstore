/**
 * «Не уходите!» — когда покупатель отменяет заказ, предлагаем скидку вместо отмены.
 * Один раз на человека (users.retention_offer_at), только пока заказ можно отменить.
 * Сумма считается только здесь, на сервере: из браузера приходит лишь «да» или «нет».
 */
export const RETENTION_PERCENT = 30;

const CANCELLABLE = ["PENDING_PAYMENT", "PAID"];

export type RetentionOffer = {
  percent: number;
  /** скидка в копейках, округлена до рубля */
  discount: number;
  /** новая сумма заказа */
  newTotal: number;
  /** сколько вернём на карту — если заказ уже оплачен */
  refund: number;
};

export function retentionOffer(
  order: { status: string; total: number; discount: number },
  offeredAt: Date | null,
): RetentionOffer | null {
  if (offeredAt || order.discount > 0 || !CANCELLABLE.includes(order.status)) return null;
  const discount = Math.round((order.total * RETENTION_PERCENT) / 100 / 100) * 100;
  if (discount <= 0) return null;
  return {
    percent: RETENTION_PERCENT,
    discount,
    newTotal: order.total - discount,
    refund: order.status === "PAID" ? discount : 0,
  };
}
