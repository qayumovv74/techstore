"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/*
  GlowCard — рамка карточки подсвечивается там, где курсор.
  Отличия от исходника: один общий обработчик pointermove на все карточки (а не по одному
  на каждую), обновление раз в кадр, без touch-action: none (иначе на телефоне не листается
  каталог), CSS псевдоэлементов — в globals.css, а не <style> в каждой карточке.
*/

type GlowColor = "violet" | "blue" | "purple" | "green" | "red" | "orange";

const glowColorMap: Record<GlowColor, { base: number; spread: number }> = {
  violet: { base: 250, spread: 70 },
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 },
};

const sizeMap = { sm: "w-48 h-64", md: "w-64 h-80", lg: "w-80 h-96" };

// ─── общий трекер курсора ───
const cards = new Set<HTMLElement>();
let frame = 0;
let px = -9999;
let py = -9999;

function apply(el: HTMLElement) {
  el.style.setProperty("--x", px.toFixed(1));
  el.style.setProperty("--y", py.toFixed(1));
  el.style.setProperty("--xp", (px / window.innerWidth).toFixed(3));
  el.style.setProperty("--yp", (py / window.innerHeight).toFixed(3));
}
function flush() {
  frame = 0;
  cards.forEach(apply);
}
function onMove(e: PointerEvent) {
  px = e.clientX;
  py = e.clientY;
  if (!frame) frame = requestAnimationFrame(flush);
}
function track(el: HTMLElement) {
  if (!cards.size) document.addEventListener("pointermove", onMove, { passive: true });
  cards.add(el);
  apply(el);
  return () => {
    cards.delete(el);
    if (!cards.size) document.removeEventListener("pointermove", onMove);
  };
}

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: GlowColor;
  size?: keyof typeof sizeMap;
  width?: string | number;
  height?: string | number;
  /** true — размеры задаёт className/width/height, а не size */
  customSize?: boolean;
  /** тег корня: для товара — article */
  as?: ElementType;
}

export function GlowCard({
  children,
  className = "",
  glowColor = "violet",
  size = "md",
  width,
  height,
  customSize = false,
  as: Tag = "div",
}: GlowCardProps) {
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (cardRef.current) return track(cardRef.current);
  }, []);

  const { base, spread } = glowColorMap[glowColor];
  const style = {
    "--base": base,
    "--spread": spread,
    "--radius": "20",
    "--border": "2",
    "--backdrop": "rgb(10 9 34 / 0.78)",
    "--backup-border": "rgb(145 107 191 / 0.16)",
    "--size": "220",
    "--outer": "1",
    "--border-size": "calc(var(--border, 2) * 1px)",
    "--spotlight-size": "calc(var(--size, 150) * 1px)",
    "--hue": "calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))",
    backgroundImage: `radial-gradient(
      var(--spotlight-size) var(--spotlight-size) at
      calc(var(--x, -999) * 1px)
      calc(var(--y, -999) * 1px),
      hsl(var(--hue, 260) calc(var(--saturation, 90) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.1)), transparent
    )`,
    backgroundColor: "var(--backdrop, transparent)",
    backgroundSize: "calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))",
    backgroundPosition: "50% 50%",
    backgroundAttachment: "fixed",
    border: "var(--border-size) solid var(--backup-border)",
    position: "relative",
    width: width === undefined ? undefined : typeof width === "number" ? `${width}px` : width,
    height: height === undefined ? undefined : typeof height === "number" ? `${height}px` : height,
  } as CSSProperties;

  return (
    <Tag
      ref={cardRef}
      data-glow
      style={style}
      className={cn(
        !customSize && sizeMap[size],
        !customSize && "aspect-[3/4]",
        "relative grid grid-rows-[1fr_auto] gap-4 rounded-[20px] p-4 shadow-[0_1rem_2rem_-1rem_black]",
        className,
      )}
    >
      <div data-glow aria-hidden />
      {children}
    </Tag>
  );
}
