"use client";

/* eslint-disable @next/next/no-img-element -- превью только что выбранных файлов: blob: URL, next/image тут не нужен */
import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button, Field } from "@/components/ui";
import { Toast } from "@/components/ui/toast";
import { saveProduct, type ProductState } from "./actions";

type Img = { id: string; url: string };
type Initial = {
  id: string | null;
  name: string;
  brand: string;
  categoryId: string;
  price: string;
  description: string;
  quantity: number;
  reserved: number;
  isActive: boolean;
  specs: [string, string][];
  images: Img[];
};

type FormProps = { initial: Initial; categories: { id: string; name: string }[] };

export function ProductForm({ initial, categories }: FormProps) {
  const [state, action, pending] = useActionState<ProductState, FormData>(saveProduct.bind(null, initial.id), {});
  const created = state.created;

  // после добавления — наверх, к сообщению: форма уже пустая и готова к следующему товару
  useEffect(() => {
    if (created) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [created]);

  return (
    <>
      {created ? (
        <div role="status" className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-violet/50 bg-violet/10 px-4 py-3 text-sm">
          <CheckCircle2 className="size-5 shrink-0 text-lilac" aria-hidden />
          <span className="font-semibold">{state.message}</span>
          <span className="text-muted">Форма очищена — можно добавлять следующий.</span>
          <span className="flex gap-3 sm:ml-auto">
            <Link href={`/product/${created.slug}`} className="font-semibold text-lilac hover:text-white">Открыть на витрине</Link>
            <Link href={`/admin/products/${created.id}`} className="font-semibold text-lilac hover:text-white">Редактировать</Link>
          </span>
        </div>
      ) : null}
      <Toast nonce={created ? state.nonce : undefined}>
        <p className="font-semibold">Товар добавлен</p>
        <p className="truncate text-muted">{created?.name}</p>
      </Toast>
      {/* key: после сохранения поля, характеристики и превью фото сбрасываются */}
      <FormBody key={state.nonce ?? "form"} initial={initial} categories={categories} state={state} action={action} pending={pending} />
    </>
  );
}

function FormBody({
  initial,
  categories,
  state,
  action,
  pending,
}: FormProps & { state: ProductState; action: (fd: FormData) => void; pending: boolean }) {
  const isNewSaved = !initial.id && state.ok; // новый товар сохранён — старые значения не подставляем
  const v = isNewSaved ? {} : (state.values ?? {});
  const fe = state.fieldErrors ?? {};
  // у строк стабильные id: поля неконтролируемые, и при удалении строки значения не должны «съезжать»
  const [specs, setSpecs] = useState(() =>
    (initial.specs.length ? initial.specs : [["", ""]]).map(([k, val], i) => ({ id: i, k, val })),
  );
  const [images, setImages] = useState(initial.images);
  const [previews, setPreviews] = useState<string[]>([]);

  const move = (i: number, d: -1 | 1) =>
    setImages((list) => {
      const next = [...list];
      const j = i + d;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-6">
        <section className="grid gap-4 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Название" name="name" defaultValue={v.name ?? initial.name} errors={fe.name} placeholder="iPhone 17 Pro 256GB" />
          </div>
          <Field label="Бренд" name="brand" defaultValue={v.brand ?? initial.brand} errors={fe.brand} placeholder="Apple" />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Категория</span>
            <select name="categoryId" defaultValue={v.categoryId ?? initial.categoryId}
              className={`h-11 rounded-xl border bg-surface px-3 ${fe.categoryId ? "border-danger" : "border-border"}`}>
              <option value="">— выберите —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {fe.categoryId ? <span className="text-danger">{fe.categoryId[0]}</span> : null}
          </label>
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            <span className="font-medium">Описание</span>
            <textarea name="description" rows={4} defaultValue={v.description ?? initial.description}
              className="rounded-xl border border-border bg-surface p-3 text-base outline-none focus:border-primary" />
          </label>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="font-semibold">Характеристики</h3>
          <div className="mt-3 flex flex-col gap-2">
            {specs.map(({ id, k, val }, i) => (
              <div key={id} className="grid grid-cols-[1fr_1.5fr_auto] gap-2">
                <input name="specKey" defaultValue={k} placeholder="Экран" aria-label={`Характеристика ${i + 1}`}
                  className="h-10 rounded-xl border border-border bg-bg px-3 text-sm" />
                <input name="specValue" defaultValue={val} placeholder={'6.3" OLED'} aria-label={`Значение ${i + 1}`}
                  className="h-10 rounded-xl border border-border bg-bg px-3 text-sm" />
                <button type="button" onClick={() => setSpecs((s) => s.filter((row) => row.id !== id))}
                  aria-label="Удалить строку" className="h-10 rounded-xl px-3 text-muted hover:text-danger">×</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setSpecs((s) => [...s, { id: Math.max(-1, ...s.map((r) => r.id)) + 1, k: "", val: "" }])} className="mt-3 text-sm font-medium text-primary">
            + Добавить строку
          </button>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="font-semibold">Фото</h3>
          <p className="mt-1 text-xs text-muted">Первое — главное. JPG, PNG или WebP до 8 МБ, сохраним квадратом 1000×1000.</p>
          {images.length ? (
            <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {images.map((img, i) => (
                <li key={img.id} className="relative">
                  <input type="hidden" name="keepImage" value={img.id} />
                  <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-white">
                    <Image src={img.url} alt="" fill sizes="120px" className="object-cover" />
                  </div>
                  <div className="mt-1 flex justify-between text-xs">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Левее" className="px-1 disabled:opacity-30">←</button>
                    <button type="button" onClick={() => setImages((l) => l.filter((x) => x.id !== img.id))} className="text-danger">Удалить</button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label="Правее" className="px-1 disabled:opacity-30">→</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          <input type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple aria-label="Добавить фото"
            onChange={(e) => setPreviews(Array.from(e.target.files ?? []).map((f) => URL.createObjectURL(f)))}
            className="mt-4 block w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-surface-2 file:px-4 file:py-2 file:text-sm" />
          {previews.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {previews.map((src) => <img key={src} src={src} alt="" className="size-20 rounded-xl border border-border object-cover" />)}
            </div>
          ) : null}
        </section>
      </div>

      <aside className="flex h-fit flex-col gap-4 rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-28">
        <Field label="Цена, ₽" name="price" inputMode="decimal" defaultValue={v.price ?? initial.price} errors={fe.price} placeholder="129990" />
        <Field label="На складе, шт." name="quantity" type="number" min={0} defaultValue={v.quantity ?? String(initial.quantity)} errors={fe.quantity} />
        {initial.reserved ? <p className="-mt-2 text-xs text-muted">из них в резерве (ждут оплаты): {initial.reserved}</p> : null}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={initial.isActive} className="size-4 accent-[var(--primary)]" />
          Показывать на витрине
        </label>
        {state.error ? <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p> : null}
        {state.ok && initial.id ? <p role="status" className="text-sm font-medium text-lilac">✓ {state.message}</p> : null}
        <Button disabled={pending}>{pending ? "Сохраняем…" : initial.id ? "Сохранить" : "Создать товар"}</Button>
      </aside>
    </form>
  );
}
