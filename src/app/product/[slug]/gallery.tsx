"use client";

import Image from "next/image";
import { useState } from "react";

type Photo = { id: string; url: string };

export function Gallery({ images, alt }: { images: Photo[]; alt: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-white">
        <Image src={current.url} alt={alt} fill preload loading="eager" fetchPriority="high" sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
      </div>
      {images.length > 1 ? (
        <div className="flex gap-2" role="tablist" aria-label="Фото товара">
          {images.map((img, i) => (
            <button
              key={img.id}
              role="tab"
              aria-selected={i === active}
              aria-label={`Фото ${i + 1}`}
              onClick={() => setActive(i)}
              className={`relative size-16 overflow-hidden rounded-xl border-2 ${i === active ? "border-primary" : "border-border"}`}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
