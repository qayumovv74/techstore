"use client";

import { useActionState, useState, useTransition } from "react";
import { Camera, Trash2 } from "lucide-react";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import type { ActionState } from "@/lib/validation";
import { removeAvatar, updateAvatar } from "./actions";

/** Фото профиля: выбрал файл — сразу видно превью, «Сохранить» — загружаем */
export function AvatarForm({ name, src }: { name: string; src: string | null }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateAvatar, {});
  const [removing, startRemove] = useTransition();
  // превью привязано к nonce: после успешной загрузки nonce меняется и превью само пропадает
  const [preview, setPreview] = useState<{ url: string; nonce: number | undefined } | null>(null);
  const shown = preview && preview.nonce === state.nonce ? preview.url : null;

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="relative w-fit">
        <div aria-hidden className="absolute -inset-2 rounded-full bg-[conic-gradient(from_180deg,#916bbf,#3d2c8d,#c4b5e8,#916bbf)] opacity-70 blur-md" />
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- превью из blob:, next/image его не оптимизирует
          <img src={shown} alt="Новое фото" className="relative size-24 rounded-full object-cover ring-2 ring-white/20" />
        ) : (
          <UserAvatar name={name} src={src} className="relative size-24 text-3xl ring-2 ring-white/20" />
        )}
      </div>

      <form action={action} key={state.nonce ?? "form"} className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <label className={buttonVariants({ variant: "outline", className: "cursor-pointer font-semibold" })}>
            <Camera aria-hidden />
            {src || shown ? "Выбрать другое фото" : "Загрузить фото"}
            <input
              type="file"
              name="avatar"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (preview) URL.revokeObjectURL(preview.url);
                setPreview(file ? { url: URL.createObjectURL(file), nonce: state.nonce } : null);
              }}
            />
          </label>
          {shown ? (
            <Button type="submit" loading={pending} className="font-semibold">
              Сохранить фото
            </Button>
          ) : src ? (
            <Button
              variant="ghost"
              loading={removing}
              leftIcon={<Trash2 aria-hidden />}
              leftIconMotion="trash"
              onClick={() => startRemove(() => removeAvatar())}
              className="text-muted hover:text-danger"
            >
              Удалить
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted">JPG, PNG или WebP до 8 МБ. Обрежем по центру в квадрат.</p>
        {state.error ? <p role="alert" className="text-sm text-danger">{state.error}</p> : null}
        {state.ok ? <p role="status" className="text-sm text-lilac">✓ {state.message}</p> : null}
      </form>
    </div>
  );
}
