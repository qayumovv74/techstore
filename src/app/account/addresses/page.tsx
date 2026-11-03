import type { Metadata } from "next";
import { Suspense } from "react";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui";
import { deleteAddress, setDefaultAddress } from "../actions";
import { AddressForm } from "../forms";
import { PanelSkeleton } from "../skeleton";

export const metadata: Metadata = { title: "Адреса доставки" };

export default function AddressesPage() {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <Addresses />
    </Suspense>
  );
}

async function Addresses() {
  const user = await requireUser("/account/addresses");
  const list = await db.query.addresses.findMany({
    where: eq(schema.addresses.userId, user.id),
    orderBy: [desc(schema.addresses.isDefault), desc(schema.addresses.createdAt)],
  });

  return (
    <div className="flex flex-col gap-6">
      {list.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((a) => (
            <li key={a.id} className={`flex flex-col rounded-2xl border bg-surface p-5 ${a.isDefault ? "border-primary" : "border-border"}`}>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{a.label}</p>
                {a.isDefault ? <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-on-primary">основной</span> : null}
              </div>
              <p className="mt-2 text-sm">
                {a.city}, {a.street}
                {a.apartment ? `, кв. ${a.apartment}` : ""}
              </p>
              {a.comment ? <p className="mt-1 text-xs text-muted">{a.comment}</p> : null}
              <div className="mt-4 flex gap-4 text-sm">
                {!a.isDefault ? (
                  <form action={setDefaultAddress}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="font-medium text-primary hover:text-primary-hover">Сделать основным</button>
                  </form>
                ) : null}
                <form action={deleteAddress}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="text-danger hover:underline" aria-label={`Удалить адрес ${a.label}`}>Удалить</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted">
          Адресов пока нет. Добавьте адрес — при оформлении заказа он подставится сам.
        </p>
      )}
      <Card>
        <h2 className="text-lg font-bold">Новый адрес</h2>
        <div className="mt-5">
          <AddressForm />
        </div>
      </Card>
    </div>
  );
}
