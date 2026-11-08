"use client";

import { useActionState } from "react";
import { CreditCardForm } from "@/components/ui/credit-card-form";
import { processPayment, type PayState } from "./actions";

export function PayForm({ externalId, amountLabel }: { externalId: string; amountLabel: string }) {
  const [state, action, pending] = useActionState<PayState, FormData>(processPayment.bind(null, externalId), {});
  return <CreditCardForm action={action} pending={pending} error={state.error} submitLabel={`Оплатить ${amountLabel}`} />;
}
