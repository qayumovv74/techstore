import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { getCity } from "@/lib/city";
import { deliveryInfo } from "@/data/cities";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Оформление заказа" };

export default function CheckoutPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Оформление заказа</h1>
      <div className="mt-6">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface-2" />}>
          <Checkout />
        </Suspense>
      </div>
    </main>
  );
}

async function Checkout() {
  const user = await requireUser("/checkout");
  const [cart, city, profile, addresses] = await Promise.all([
    getCart(),
    getCity(),
    db.query.users.findFirst({ where: eq(schema.users.id, user.id), columns: { phone: true } }),
    db.query.addresses.findMany({
      where: eq(schema.addresses.userId, user.id),
      orderBy: [desc(schema.addresses.isDefault), desc(schema.addresses.createdAt)],
    }),
  ]);
  if (!cart.items.length) redirect("/cart");
  const info = deliveryInfo(city);

  return (
    <CheckoutForm
      name={user.name}
      phone={profile?.phone ?? ""}
      city={city}
      addresses={addresses.filter((a) => a.city === city)}
      itemsTotal={cart.total}
      count={cart.count}
      courier={{ when: info.courier, price: info.courierPrice }}
      pickupWhen={info.pickup}
    />
  );
}
