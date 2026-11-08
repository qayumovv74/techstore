"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { UserAvatar } from "./avatar";
import { Stars } from "@/components/stars";
import { cn } from "@/lib/cn";

/*
  Карусель отзывов (profile-card-testimonial-carousel). Вместо выдуманных людей и соцсетей —
  настоящие отзывы из базы: фото купленного товара, автор, оценка и ссылка на товар.
*/

export interface Testimonial {
  id: string;
  userName: string;
  avatarUrl: string | null;
  rating: number;
  text: string;
  date: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
}

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.4, ease: "easeInOut" as const } };

export function TestimonialCarousel({ testimonials, className }: { testimonials: Testimonial[]; className?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  if (!testimonials.length) return null;

  const t = testimonials[currentIndex % testimonials.length];
  const next = () => setCurrentIndex((i) => (i + 1) % testimonials.length);
  const prev = () => setCurrentIndex((i) => (i - 1 + testimonials.length) % testimonials.length);

  const photo = (size: number) => (
    <AnimatePresence mode="wait">
      <motion.div key={t.id} {...fade} className="relative h-full w-full">
        {t.productImage ? (
          <Image src={t.productImage} alt={t.productName} width={size} height={size} className="h-full w-full object-cover" draggable={false} />
        ) : (
          <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle,#1b1748,#0b0a22)] p-8 text-center text-lg font-semibold text-lilac">
            {t.productName}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );

  const body = (
    <AnimatePresence mode="wait">
      <motion.div key={t.id} {...fade}>
        <div className="mb-5 flex items-center gap-3">
          <UserAvatar name={t.userName} src={t.avatarUrl} className="size-12 text-lg" />
          <div className="min-w-0 text-left">
            <p className="truncate text-lg font-bold">{t.userName}</p>
            <p className="flex items-center gap-1 text-xs text-lilac">
              <ShieldCheck className="size-3.5" aria-hidden /> Купил(а) в TechStore · {t.date}
            </p>
          </div>
        </div>
        <Stars value={t.rating} size="size-5" />
        <p className="mt-4 line-clamp-6 text-base leading-relaxed text-text/90">«{t.text}»</p>
        <Link
          href={`/product/${t.productSlug}#reviews`}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold transition-colors hover:border-violet/60 hover:bg-violet/15"
        >
          {t.productName} <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div className={cn("mx-auto w-full max-w-5xl", className)}>
      {/* компьютер: фото слева, карточка заезжает на него */}
      <div className="relative hidden items-center md:flex">
        <div className="size-[420px] shrink-0 overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_50%_40%,#ffffff,#ece8f6)]">{photo(420)}</div>
        <div className="z-10 -ml-20 max-w-xl flex-1 rounded-3xl border border-white/10 bg-ink/75 p-8 shadow-2xl backdrop-blur-xl">{body}</div>
      </div>

      {/* телефон: фото сверху, текст снизу */}
      <div className="mx-auto max-w-sm md:hidden">
        <div className="mb-5 aspect-square w-full overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_50%_40%,#ffffff,#ece8f6)]">{photo(400)}</div>
        <div className="rounded-3xl border border-white/10 bg-ink/70 p-5 backdrop-blur-xl">{body}</div>
      </div>

      {testimonials.length > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-6">
          <button
            onClick={prev}
            aria-label="Предыдущий отзыв"
            className="flex size-12 items-center justify-center rounded-full border border-white/15 bg-ink/60 backdrop-blur transition-colors hover:bg-violet/20"
          >
            <ChevronLeft className="size-6" />
          </button>
          <div className="flex gap-2">
            {testimonials.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(i)}
                className={cn("size-3 rounded-full transition-colors", i === currentIndex % testimonials.length ? "bg-lilac" : "bg-white/25 hover:bg-white/40")}
                aria-label={`Отзыв ${i + 1}`}
                aria-current={i === currentIndex % testimonials.length || undefined}
              />
            ))}
          </div>
          <button
            onClick={next}
            aria-label="Следующий отзыв"
            className="flex size-12 items-center justify-center rounded-full border border-white/15 bg-ink/60 backdrop-blur transition-colors hover:bg-violet/20"
          >
            <ChevronRight className="size-6" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
